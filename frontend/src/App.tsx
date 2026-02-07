import React from 'react';
import { WalletContextProvider } from './contexts/WalletProvider';
import { StreakComponent } from './components/StreakComponent';
import './App.css';

function App() {
  return (
    <WalletContextProvider>
      <div className="app-container">
        <StreakComponent />
      </div>
    </WalletContextProvider>
  );
}

export default App;
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjbVHGA8GhpV29i');

// Badge milestones configuration
const BADGE_MILESTONES = [
  {
    days: 7,
    name: 'Civic Starter',
    symbol: 'CIVIC7',
    uri: '/badges/civic-starter.json',
    description: '7-day civic engagement badge',
    icon: '🌟',
    color: '#fbbf24',
    reward: 100,
  },
  {
    days: 30,
    name: 'Consistent Citizen',
    symbol: 'CIVIC30',
    uri: '/badges/civic-citizen.json',
    description: '30-day civic engagement badge',
    icon: '🏆',
    color: '#60a5fa',
    reward: 250,
  },
  {
    days: 100,
    name: 'Civic Champion',
    symbol: 'CIVIC100',
    uri: '/badges/civic-champion.json',
    description: '100-day civic engagement badge',
    icon: '👑',
    color: '#a78bfa',
    reward: 500,
  },
];

// =====================================================
// IDL (Simplified for prototype)
// =====================================================
const IDL = {
  version: '0.1.0',
  name: 'civic_streak',
  instructions: [
    {
      name: 'initializeUserStreak',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'userStreak', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'recordDailyEngagement',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'userStreak', isMut: true, isSigner: false },
        { name: 'tokenMint', isMut: false, isSigner: false },
        { name: 'userTokenAccount', isMut: true, isSigner: false },
        { name: 'stakeVault', isMut: true, isSigner: false },
        { name: 'mintAuthority', isMut: false, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'mintBadge',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'userStreak', isMut: true, isSigner: false },
        { name: 'badgeMint', isMut: true, isSigner: false },
        { name: 'badgeMintAuthority', isMut: false, isSigner: false },
        { name: 'userTokenAccount', isMut: true, isSigner: false },
        { name: 'metadataProgram', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'rent', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'badgeDays', type: 'u64' },
        { name: 'badgeName', type: 'string' },
        { name: 'badgeSymbol', type: 'string' },
        { name: 'badgeUri', type: 'string' },
      ],
    },
  ],
  accounts: [
    {
      name: 'UserStreak',
      type: {
        fields: [
          { name: 'user', type: 'pubkey' },
          { name: 'streakCount', type: 'u64' },
          { name: 'lastInteractionTs', type: 'i64' },
          { name: 'createdTs', type: 'i64' },
          { name: 'totalMilestoneClaimed', type: 'u8' },
          { name: 'badgesMinted', type: 'u8' },
        ],
        name: 'userStreak',
      },
    },
  ],
};

// =====================================================
// CONSTANTS
// =====================================================
const STREAK_SEED = 'streak';
const BADGE_SEED = 'badge';

// =====================================================
// MAIN APP COMPONENT
// =====================================================
function AppContent() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  // UI State
  const [streakCount, setStreakCount] = useState<number>(0);
  const [lastActive, setLastActive] = useState<string>('');
  const [civicPoints, setCivicPoints] = useState<number>(0);
  const [badgesMinted, setBadgesMinted] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [hasStreakAccount, setHasStreakAccount] = useState(false);
  const [canClaimToday, setCanClaimToday] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGE_MILESTONES[0] | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isMintingBadge, setIsMintingBadge] = useState(false);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStreakPda = useCallback((userPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(STREAK_SEED), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, []);

  const getBadgeMintPda = useCallback((userPubkey: PublicKey, badgeDays: number) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(BADGE_SEED), userPubkey.toBuffer(), new BN(badgeDays).toArrayLike(Buffer, 'le', 8)],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // =====================================================
  // FETCH USER DATA
  // =====================================================
  const fetchUserData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const streakPda = getStreakPda(publicKey);
      const accountInfo = await connection.getAccountInfo(streakPda);

      if (accountInfo && accountInfo.data.length > 0) {
        // Parse UserStreak data
        const data = accountInfo.data;
        const streakCount = Number(data.slice(32, 40).readBigUInt64LE());
        const lastInteractionTs = data.slice(40, 48).readBigInt64LE();
        const badgesBits = data[57]; // badges_minted field

        setStreakCount(streakCount);
        setHasStreakAccount(true);
        
        const lastActiveDate = new Date(Number(lastInteractionTs) * 1000);
        setLastActive(lastActiveDate.toLocaleDateString());

        const hoursSinceLast = (Date.now() / 1000 - Number(lastInteractionTs)) / 3600;
        setCanClaimToday(hoursSinceLast >= 24);

        // Parse badges (bitmask: bit 0=7day, bit1=30day, bit2=100day)
        const earned: number[] = [];
        if (badgesBits & 0b001) earned.push(7);
        if (badgesBits & 0b010) earned.push(30);
        if (badgesBits & 0b100) earned.push(100);
        setBadgesMinted(earned);

        // Calculate points from milestones
        const totalPoints = earned.reduce((acc, day) => {
          const milestone = BADGE_MILESTONES.find(m => m.days === day);
          return acc + (milestone?.reward || 0);
        }, 0);
        setCivicPoints(totalPoints);

        // Save to localStorage
        localStorage.setItem('earnedBadges', JSON.stringify(earned));
      } else {
        setHasStreakAccount(false);
        setStreakCount(0);
        setBadgesMinted([]);
        setCivicPoints(0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [publicKey, connection, getStreakPda]);

  useEffect(() => {
    if (publicKey) {
      // Load saved badges from localStorage first
      const saved = localStorage.getItem('earnedBadges');
      if (saved) {
        setBadgesMinted(JSON.parse(saved));
      }
      fetchUserData();
    }
  }, [publicKey, fetchUserData]);

  // =====================================================
  // STREAK FUNCTIONS
  // =====================================================
  const initializeStreak = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const streakPda = getStreakPda(publicKey);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: streakPda,
          lamports: await connection.getMinimumBalanceForRentExemption(64),
          space: 64,
          programId: PROGRAM_ID,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      showNotification('success', '🎉 Streak account created! Start your civic journey!');
      fetchUserData();
    } catch (error) {
      console.error('Error initializing streak:', error);
      showNotification('error', 'Failed to create streak account');
    } finally {
      setIsLoading(false);
    }
  };

  const recordDailyEngagement = async () => {
    if (!publicKey || !selectedAction) {
      showNotification('error', 'Please select a civic action first');
      return;
    }

    setIsLoading(true);
    try {
      const program = new Program(IDL as any, PROGRAM_ID);
      
      const tx = await program.methods
        .recordDailyEngagement()
        .accounts({
          user: publicKey,
          userStreak: getStreakPda(publicKey),
          tokenMint: TOKEN_MINT,
          userTokenAccount: new PublicKey('YourUserTokenAccount'),
          stakeVault: new PublicKey('YourStakeVault'),
          mintAuthority: getStreakPda(publicKey),
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      setCanClaimToday(false);
      setLastActive(new Date().toLocaleDateString());

      showNotification('success', `🔥 Streak continued! You're on a ${newStreak}-day streak!`);
      fetchUserData();
    } catch (error: any) {
      console.error('Error recording engagement:', error);
      
      if (error.message?.includes('already claimed')) {
        showNotification('error', "You've already claimed your civic action today!");
      } else {
        showNotification('error', 'Failed to record engagement');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // NFT BADGE FUNCTIONS
  // =====================================================
  const mintBadge = async (milestone: typeof BADGE_MILESTONES[0]) => {
    if (!publicKey) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    if (badgesMinted.includes(milestone.days)) {
      showNotification('error', 'You already own this badge!');
      return;
    }

    if (streakCount < milestone.days) {
      showNotification('error', `You need ${milestone.days - streakCount} more days to earn this badge`);
      return;
    }

    setIsMintingBadge(true);
    try {
      const program = new Program(IDL as any, PROGRAM_ID);

      // Get badge mint PDA
      const badgeMint = getBadgeMintPda(publicKey, milestone.days);
      const [badgeMintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(BADGE_SEED), publicKey.toBuffer(), new BN(milestone.days).toArrayLike(Buffer, 'le', 8)],
        PROGRAM_ID
      );

      // In production, you would:
      // 1. Create ATA for badge if needed
      // 2. Mint NFT via CPI to Metaplex
      // 3. Create metadata account
      
      // Simulated badge mint for prototype
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save badge locally for prototype
      const newEarned = [...badgesMinted, milestone.days];
      setBadgesMinted(newEarned);
      localStorage.setItem('earnedBadges', JSON.stringify(newEarned));
      setCivicPoints(prev => prev + milestone.reward);

      showNotification('success', `🎖️ Badge "${milestone.name}" minted! +${milestone.reward} points!`);
      setShowBadgeModal(false);
      
      // Trigger celebration animation (would be implemented with confetti library)
      triggerCelebration();
    } catch (error: any) {
      console.error('Error minting badge:', error);
      showNotification('error', 'Failed to mint badge. Please try again.');
    } finally {
      setIsMintingBadge(false);
    }
  };

  const triggerCelebration = () => {
    // Simple celebration - in production use confetti.js or similar
    console.log('🎉 CELEBRATION! Badge earned!');
  };

  const viewOnSolanaExplorer = (mintAddress: string) => {
    const explorerUrl = `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  // =====================================================
  // STREAK STATUS
  // =====================================================
  const getStreakStatus = () => {
    if (!hasStreakAccount) return { status: 'inactive', message: 'No streak yet' };
    if (!canClaimToday) return { status: 'active', message: 'Claimed today' };
    
    const hoursSinceLast = 24;
    if (hoursSinceLast > 36) return { status: 'warning', message: 'Streak at risk!' };
    
    return { status: 'active', message: 'Keep it up!' };
  };

  const status = getStreakStatus();

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>🏛️ Civic Streak V2</h1>
        <p>Earn NFT badges for consistent civic engagement</p>
      </header>

      {/* Wallet Connection */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Wallet</h2>
          <WalletMultiButton />
        </div>
        
        {publicKey ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Connect your Phantom wallet to get started
          </p>
        )}
      </div>

      {/* Streak Display */}
      {publicKey && (
        <>
          {/* Main Streak Card */}
          <div className="card">
            <div className="streak-display">
              <div className="streak-number">{streakCount}</div>
              <div className="streak-label">Day Streak</div>
              <span className={`streak-status status-${status.status}`}>
                {status.message}
              </span>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{lastActive || 'N/A'}</div>
                  <div className="stat-label">Last Active</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{hasStreakAccount ? 'Yes' : 'No'}</div>
                  <div className="stat-label">Active Account</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{canClaimToday ? 'Yes' : 'No'}</div>
                  <div className="stat-label">Can Claim Today</div>
                </div>
              </div>

              {/* Points Display */}
              <div className="points-display">
                <span className="points-icon">🪙</span>
                <span className="points-value">{civicPoints}</span>
                <span className="points-label">CIVIC POINTS</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📅 Today's Civic Action</h2>
            </div>
            
            <div className="action-section">
              {!hasStreakAccount ? (
                <button 
                  className="btn btn-primary"
                  onClick={initializeStreak}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : '🚀 Start Your Streak'}
                </button>
              ) : (
                <>
                  {/* Civic Actions Selection */}
                  <div className="civic-actions">
                    <button
                      className={`civic-action-btn ${selectedAction === 'vote' ? 'selected' : ''}`}
                      onClick={() => setSelectedAction('vote')}
                    >
                      <span className="action-icon">🗳️</span>
                      <span>Vote on Poll</span>
                    </button>
                    <button
                      className={`civic-action-btn ${selectedAction === 'read' ? 'selected' : ''}`}
                      onClick={() => setSelectedAction('read')}
                    >
                      <span className="action-icon">📰</span>
                      <span>Read Issue Summary</span>
                    </button>
                    <button
                      className={`civic-action-btn ${selectedAction === 'acknowledge' ? 'selected' : ''}`}
                      onClick={() => setSelectedAction('acknowledge')}
                    >
                      <span className="action-icon">✅</span>
                      <span>Acknowledge Topic</span>
                    </button>
                  </div>

                  {/* Record Button */}
                  <button
                    className="btn btn-primary"
                    onClick={recordDailyEngagement}
                    disabled={isLoading || !selectedAction || !canClaimToday}
                  >
                    {isLoading ? '⏳ Processing...' : !canClaimToday ? '✅ Already Claimed Today' : '📅 Mark Today\'s Civic Action'}
                  </button>

                  <p style={{ 
                    marginTop: '16px', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    Visit daily to maintain your streak! Miss 48 hours and streak resets to 1.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* NFT Badge Gallery */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🎖️ NFT Badge Collection</h2>
            </div>
            
            <div className="badge-gallery">
              {BADGE_MILESTONES.map((milestone) => {
                const isEarned = badgesMinted.includes(milestone.days);
                const isEligible = streakCount >= milestone.days;
                const progress = Math.min(100, (streakCount / milestone.days) * 100);

                return (
                  <div 
                    key={milestone.days}
                    className={`badge-card ${isEarned ? 'earned' : ''} ${isEligible ? 'eligible' : ''}`}
                    onClick={() => {
                      if (isEarned || isEligible) {
                        setSelectedBadge(milestone);
                        setShowBadgeModal(true);
                      }
                    }}
                  >
                    <div 
                      className="badge-icon"
                      style={{ 
                        background: isEarned ? milestone.color : 'var(--border-color)',
                        opacity: isEarned ? 1 : 0.5
                      }}
                    >
                      {isEarned ? milestone.icon : '🔒'}
                    </div>
                    
                    <div className="badge-info">
                      <h3 className="badge-name">{milestone.name}</h3>
                      <p className="badge-description">{milestone.days} day streak</p>
                      
                      {/* Progress bar for locked badges */}
                      {!isEarned && (
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${progress}%`,
                                background: milestone.color
                              }}
                            />
                          </div>
                          <span className="progress-text">
                            {streakCount}/{milestone.days} days
                          </span>
                        </div>
                      )}
                      
                      {isEarned && (
                        <span className="badge-status earned">✅ Earned</span>
                      )}
                      {!isEarned && isEligible && (
                        <span className="badge-status ready">🎉 Ready to Mint!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Badge Detail Modal */}
      {showBadgeModal && selectedBadge && (
        <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBadgeModal(false)}>×</button>
            
            <div className="modal-badge">
              <div 
                className="modal-badge-icon"
                style={{ background: selectedBadge.color }}
              >
                {badgesMinted.includes(selectedBadge.days) ? selectedBadge.icon : '🔒'}
              </div>
            </div>
            
            <h2 className="modal-title">{selectedBadge.name}</h2>
            <p className="modal-subtitle">{selectedBadge.days}-Day Streak Badge</p>
            
            <div className="modal-stats">
              <div className="modal-stat">
                <span className="stat-label">Reward</span>
                <span className="stat-value">{selectedBadge.reward} Points</span>
              </div>
              <div className="modal-stat">
                <span className="stat-label">Rarity</span>
                <span className="stat-value">
                  {selectedBadge.days === 7 ? 'Common' : selectedBadge.days === 30 ? 'Rare' : 'Legendary'}
                </span>
              </div>
            </div>
            
            <p className="modal-description">
              {selectedBadge.days === 7 && 'Your first step into civic engagement! Complete 7 consecutive days of civic actions to earn this badge.'}
              {selectedBadge.days === 30 && 'A month of dedication! This badge shows your consistent commitment to civic participation.'}
              {selectedBadge.days === 100 && 'The ultimate achievement! 100 days of civic engagement demonstrates exceptional dedication to democracy.'}
            </p>
            
            {badgesMinted.includes(selectedBadge.days) ? (
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => viewOnSolanaExplorer('MINT_ADDRESS')}
                >
                  🔗 View on Solana Explorer
                </button>
              </div>
            ) : (
              <button
                className="btn btn-success"
                onClick={() => mintBadge(selectedBadge)}
                disabled={isMintingBadge || streakCount < selectedBadge.days}
              >
                {isMintingBadge ? '⏳ Minting...' : '🎖️ Mint Badge'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

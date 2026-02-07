// Civic Streak - Main JavaScript
// Uses @solana/web3.js for blockchain interaction

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';

// =====================================================
// CONFIGURATION
// =====================================================

const PROGRAM_ID = new PublicKey('3twLpAWhqJdrQJ52pEGjUXA9yiLRpGB9fnTa6knzALze');
const CLUSTER_URL = 'https://api.devnet.solana.com';

// =====================================================
// STATE
// =====================================================

let wallet = null;
let connection = null;
let userStreakPDA = null;

// =====================================================
// DOM ELEMENTS
// =====================================================

const connectBtn = document.getElementById('connect-btn');
const walletSection = document.getElementById('wallet-section');
const walletStatus = document.getElementById('wallet-status');
const walletText = document.getElementById('wallet-text');
const walletAddress = document.getElementById('wallet-address');
const dashboard = document.getElementById('dashboard');
const claimBtn = document.getElementById('claim-btn');
const claimStatus = document.getElementById('claim-status');
const streakCount = document.getElementById('streak-count');
const lastActive = document.getElementById('last-active');
const civicPoints = document.getElementById('civic-points');
const badgesEarned = document.getElementById('badges-earned');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const toastContainer = document.getElementById('toast-container');

// =====================================================
// INITIALIZATION
// =====================================================

async function init() {
    connection = new Connection(CLUSTER_URL, 'confirmed');

    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
        wallet = window.solana;
        setupWalletListeners();
        updateWalletStatus();

        // Auto-connect if already authorized
        if (wallet.isConnected) {
            await handleWalletConnect();
        }
    } else {
        walletText.textContent = 'Phantom wallet not detected';
        showToast('Please install Phantom Wallet to use Civic Streak', 'error');
    }

    setupEventListeners();
}

// =====================================================
// WALLET HANDLING
// =====================================================

function setupWalletListeners() {
    wallet.on('connect', async () => {
        console.log('Wallet connected:', wallet.publicKey.toString());
        updateWalletStatus();
        await handleWalletConnect();
    });

    wallet.on('disconnect', () => {
        console.log('Wallet disconnected');
        updateWalletStatus();
        hideDashboard();
    });

    wallet.on('accountChanged', async () => {
        if (wallet.isConnected) {
            await handleWalletConnect();
        }
    });
}

function updateWalletStatus() {
    if (wallet && wallet.isConnected) {
        walletText.textContent = 'Wallet Connected';
        walletAddress.textContent = formatAddress(wallet.publicKey.toString());
        walletAddress.classList.remove('hidden');
        connectBtn.textContent = 'Disconnect';
        document.querySelector('.status-dot').classList.add('connected');
    } else {
        walletText.textContent = 'Connect your wallet to get started';
        walletAddress.classList.add('hidden');
        connectBtn.textContent = 'Connect Phantom Wallet';
        document.querySelector('.status-dot').classList.remove('connected');
    }
}

async function handleWalletConnect() {
    showDashboard();
    await fetchUserStreak();
    updateUI();
}

function setupEventListeners() {
    connectBtn.addEventListener('click', async () => {
        if (wallet && wallet.isConnected) {
            wallet.disconnect();
        } else {
            try {
                await wallet.connect();
            } catch (error) {
                console.error('Connection error:', error);
                showToast('Failed to connect wallet', 'error');
            }
        }
    });

    claimBtn.addEventListener('click', async () => {
        if (!wallet || !wallet.isConnected) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        claimBtn.disabled = true;
        claimBtn.textContent = 'Processing...';

        try {
            await recordDailyEngagement();
        } catch (error) {
            console.error('Claim error:', error);
            showToast('Failed to record engagement: ' + error.message, 'error');
        } finally {
            claimBtn.disabled = false;
            await fetchUserStreak();
            updateUI();
        }
    });
}

// =====================================================
// STREAK OPERATIONS (SIMULATED FOR DEMO)
// =====================================================

async function fetchUserStreak() {
    // In production, this would fetch from the blockchain
    // For demo, we use localStorage
    const stored = localStorage.getItem('civicStreak_' + wallet.publicKey.toString());

    if (stored) {
        const data = JSON.parse(stored);
        userStreakPDA = {
            streakCount: data.streakCount,
            lastInteractionTs: data.lastInteractionTs,
            civicPoints: data.civicPoints,
            badges: data.badges
        };
    } else {
        userStreakPDA = {
            streakCount: 0,
            lastInteractionTs: null,
            civicPoints: 0,
            badges: []
        };
    }
}

async function recordDailyEngagement() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 48 * 60 * 60 * 1000;

    let newStreak = userStreakPDA.streakCount;
    let message = '';
    let streakReset = false;

    if (userStreakPDA.lastInteractionTs === null) {
        // First time - start streak
        newStreak = 1;
        message = '🎉 Welcome! Your civic streak has begun!';
    } else {
        const timeSinceLast = now - userStreakPDA.lastInteractionTs;

        if (timeSinceLast < oneDayMs) {
            // Less than 24 hours - already claimed today
            throw new Error('You can only claim once every 24 hours');
        } else if (timeSinceLast <= twoDaysMs) {
            // Within 48 hours - continue streak
            newStreak = userStreakPDA.streakCount + 1;
            message = `🔥 Streak continued! ${newStreak} days strong!`;
        } else {
            // Missed the window - reset streak
            newStreak = 1;
            streakReset = true;
            message = '💔 Streak broken! But you can start fresh today!';
        }
    }

    // Calculate points
    const pointsEarned = calculatePoints(newStreak);
    const totalPoints = userStreakPDA.civicPoints + pointsEarned;

    // Check for new badges
    const earnedBadges = checkBadges(newStreak);
    let badgeMessage = '';

    if (earnedBadges.length > 0) {
        badgeMessage = ` 🏆 Earned: ${earnedBadges.join(', ')}!`;
    }

    // Save to localStorage (simulates blockchain state)
    const streakData = {
        streakCount: newStreak,
        lastInteractionTs: now,
        civicPoints: totalPoints,
        badges: [...new Set([...userStreakPDA.badges, ...earnedBadges])]
    };

    localStorage.setItem('civicStreak_' + wallet.publicKey.toString(), JSON.stringify(streakData));

    userStreakPDA = streakData;

    // Show messages
    if (streakReset) {
        showToast(message + badgeMessage, 'warning');
    } else {
        showToast(message + ` +${pointsEarned} points${badgeMessage}`, 'success');
    }

    return { newStreak, pointsEarned, earnedBadges };
}

function calculatePoints(streak) {
    // Bonus points for longer streaks
    if (streak >= 100) return 50;
    if (streak >= 30) return 25;
    if (streak >= 14) return 15;
    if (streak >= 7) return 10;
    return 5;
}

function checkBadges(streak) {
    const badges = [];

    if (streak >= 7 && !badges.includes('Civic Starter')) {
        badges.push('Civic Starter 🌟');
    }
    if (streak >= 30 && !badges.includes('Consistent Citizen')) {
        badges.push('Consistent Citizen 🏅');
    }
    if (streak >= 100 && !badges.includes('Civic Champion')) {
        badges.push('Civic Champion 👑');
    }

    return badges;
}

// =====================================================
// UI UPDATES
// =====================================================

function updateUI() {
    if (!userStreakPDA) return;

    // Update streak count with animation
    animateValue(streakCount, userStreakPDA.streakCount);

    // Update last active date
    if (userStreakPDA.lastInteractionTs) {
        const date = new Date(userStreakPDA.lastInteractionTs);
        lastActive.textContent = formatDate(date);
    } else {
        lastActive.textContent = 'Never';
    }

    // Update points
    civicPoints.textContent = userStreakPDA.civicPoints;

    // Update badges count
    const badgesCount = userStreakPDA.badges ? userStreakPDA.badges.length : 0;
    badgesEarned.textContent = `${badgesCount}/3`;

    // Update progress bar
    const nextMilestone = getNextMilestone(userStreakPDA.streakCount);
    const progress = (userStreakPDA.streakCount / nextMilestone.days) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    progressText.textContent = `${userStreakPDA.streakCount} / ${nextMilestone.days} days - ${nextMilestone.name}`;

    // Update claim button
    updateClaimButton();

    // Update badges display
    updateBadgesDisplay();
}

function updateClaimButton() {
    if (!userStreakPDA || userStreakPDA.lastInteractionTs === null) {
        claimBtn.textContent = 'Start Your Streak';
        claimBtn.disabled = false;
        claimStatus.textContent = 'Complete your first civic action today!';
        return;
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const timeSinceLast = now - userStreakPDA.lastInteractionTs;

    if (timeSinceLast < oneDayMs) {
        // Already claimed today
        const hoursLeft = Math.ceil((oneDayMs - timeSinceLast) / (1000 * 60 * 60));
        claimBtn.textContent = 'Already Claimed Today';
        claimBtn.disabled = true;
        claimStatus.textContent = `Come back in ${hoursLeft} hours`;
        claimStatus.classList.add('disabled');
    } else {
        claimBtn.textContent = 'Mark Today\'s Civic Action';
        claimBtn.disabled = false;
        claimStatus.textContent = 'Complete today\'s civic engagement!';
        claimStatus.classList.remove('disabled');
    }
}

function updateBadgesDisplay() {
    const badgeElements = {
        'Civic Starter': document.getElementById('badge-7'),
        'Consistent Citizen': document.getElementById('badge-30'),
        'Civic Champion': document.getElementById('badge-100')
    };

    Object.keys(badgeElements).forEach((badgeName, index) => {
        const element = badgeElements[badgeElements[badgeName] ? badgeName : Object.keys(badgeElements)[index]];
        if (!element) return;

        const isEarned = userStreakPDA.badges && userStreakPDA.badges.includes(badgeName);
        const statusElement = element.querySelector('.badge-status');

        if (isEarned) {
            element.classList.add('earned');
            statusElement.textContent = '✅';
            statusElement.classList.remove('locked');
        } else {
            element.classList.remove('earned');
            statusElement.textContent = '🔒';
            statusElement.classList.add('locked');
        }
    });
}

function getNextMilestone(currentStreak) {
    if (currentStreak < 7) return { days: 7, name: 'Civic Starter' };
    if (currentStreak < 30) return { days: 30, name: 'Consistent Citizen' };
    if (currentStreak < 100) return { days: 100, name: 'Civic Champion' };
    return { days: currentStreak, name: 'Max Level!' };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function formatAddress(address) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function animateValue(element, endValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(startValue + (endValue - startValue) * progress);
        element.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showDashboard() {
    dashboard.classList.remove('hidden');
}

function hideDashboard() {
    dashboard.classList.add('hidden');
}

// =====================================================
// START APP
// =====================================================

document.addEventListener('DOMContentLoaded', init);

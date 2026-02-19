import React from 'react';

export function HowItWorks() {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">How It Works</h1>
        <p className="page-subtitle">
          Learn how Civic Streak tracks and rewards your community participation
        </p>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Connect Your Wallet</h3>
            <p>
              Start by connecting your Solana wallet using the button in the header. 
              We support popular wallets like Phantom, Solflare, and Backpack. 
              Make sure you're connected to Devnet for testing.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h3>Initialize Your Profile</h3>
            <p>
              Once connected, initialize your Civic Streak profile on the blockchain. 
              This creates your unique identity for tracking all community activities. 
              This is a one-time setup process.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Record Activities</h3>
            <p>
              Participate in community events and activities. Each activity is 
              recorded on the Solana blockchain as a verified transaction, creating 
              an immutable record of your engagement.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <h3>Earn Badges</h3>
            <p>
              As you accumulate streak days and participate in more activities, 
              you'll earn badges like Civic Starter, Civic Citizen, and Civic Champion. 
              These NFTs represent your commitment to the community.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">05</div>
            <h3>Build Your Reputation</h3>
            <p>
              Your blockchain-verified participation history becomes your reputation. 
              Share your achievements and demonstrate your dedication to community 
              involvement through your verified Civic Streak profile.
            </p>
          </div>
        </div>

        <section className="info-section">
          <h2>Understanding Badges</h2>
          <div className="badges-grid">
            <div className="badge-card">
              <div className="badge-icon starter">⭐</div>
              <h4>Civic Starter</h4>
              <p>Earned for your first 7 days of consecutive participation</p>
            </div>
            <div className="badge-card">
              <div className="badge-icon citizen">🏛️</div>
              <h4>Civic Citizen</h4>
              <p>Achieved at 30 days of consistent community engagement</p>
            </div>
            <div className="badge-card">
              <div className="badge-icon champion">👑</div>
              <h4>Civic Champion</h4>
              <p>Reserved for dedicated members with 100+ day streaks</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Technical Details</h2>
          <div className="details-grid">
            <div className="detail-card">
              <h4>Blockchain Storage</h4>
              <p>
                All participation records are stored on Solana's blockchain, 
                ensuring transparency and immutability.
              </p>
            </div>
            <div className="detail-card">
              <h4>Program Derived Addresses</h4>
              <p>
                Your profile is secured using PDA, giving you full ownership 
                of your data.
              </p>
            </div>
            <div className="detail-card">
              <h4>Real-time Updates</h4>
              <p>
                Changes reflect immediately on-chain, providing instant 
                verification of your activities.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>
            Connect your wallet and begin building your civic streak today. 
            Every day counts in creating a stronger community!
          </p>
        </section>
      </div>
    </div>
  );
}

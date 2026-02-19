import React from 'react';

export function About() {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">About Civic Streak</h1>
        
        <section className="about-section">
          <h2>Empowering Community Participation on Solana</h2>
          <p>
            Civic Streak is a decentralized application built on the Solana blockchain that 
            rewards community members for their consistent participation and engagement. 
            By leveraging blockchain technology, we create transparent and verifiable records 
            of community involvement.
          </p>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            Every time you participate in community activities—whether it's attending events, 
            contributing to projects, or engaging with other members—your participation is 
            recorded on the Solana blockchain. This creates an immutable record of your 
            civic engagement that cannot be falsified or manipulated.
          </p>
        </section>

        <section className="about-section">
          <h2>Why Solana?</h2>
          <ul className="about-list">
            <li>
              <strong>Fast Transactions:</strong> Process thousands of transactions per second 
              with minimal fees
            </li>
            <li>
              <strong>Low Costs:</strong> Affordable participation for all community members
            </li>
            <li>
              <strong>Scalable:</strong> Built to handle millions of users worldwide
            </li>
            <li>
              <strong>Eco-Friendly:</strong> Proof of Stake consensus with minimal energy consumption
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            We believe that active community participation is the foundation of strong 
            organizations. By rewarding consistent engagement, we aim to foster a more 
            connected and invested community. Civic Streak makes it easy to track your 
            contributions and earn recognition for your dedication.
          </p>
        </section>

        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <h3>Solana</h3>
              <p>High-performance blockchain</p>
            </div>
            <div className="tech-card">
              <h3>Anchor</h3>
              <p>Framework for Solana programs</p>
            </div>
            <div className="tech-card">
              <h3>React</h3>
              <p>Frontend framework</p>
            </div>
            <div className="tech-card">
              <h3>TypeScript</h3>
              <p>Type-safe development</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

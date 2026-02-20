import React, { useState } from 'react';
import { WalletContextProvider } from './contexts/WalletProvider';
import { StreakComponent } from './components/StreakComponent';
import { About } from './components/About';
import { HowItWorks } from './components/HowItWorks';
import './index.css';

// Page type definition
type Page = 'home' | 'about' | 'how-it-works';

// Header Component
function Header({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand" onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="#8B5CF6" strokeWidth="2"/>
              <path d="M16 6V26M6 16H26" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="6" fill="#8B5CF6"/>
            </svg>
          </div>
          <span className="brand-name">Civic Streak</span>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M6 6L18 18M6 18L18 6" />
            ) : (
              <>
                <path d="M3 12h18M3 6h18M3 18h18" />
              </>
            )}
          </svg>
        </button>
        
        <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
          >
            About
          </button>
          <button 
            className={`nav-link ${currentPage === 'how-it-works' ? 'active' : ''}`}
            onClick={() => { onNavigate('how-it-works'); setMobileMenuOpen(false); }}
          >
            How it Works
          </button>
        </nav>
        
        <div className="header-actions">
          <a 
            href="https://github.com/prashannaLeo/civic_streak_solana" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-link"
            aria-label="GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <div className="network-badge">
            <span className="network-dot"></span>
            Devnet
          </div>
        </div>
      </div>
      
      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            >
              Home
            </button>
            <button 
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
            >
              About
            </button>
            <button 
              className={`nav-link ${currentPage === 'how-it-works' ? 'active' : ''}`}
              onClick={() => { onNavigate('how-it-works'); setMobileMenuOpen(false); }}
            >
              How it Works
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="copyright">© 2024 Civic Streak. All rights reserved.</p>
        </div>
        
        <div className="footer-center">
          <div className="footer-links">
            <a href="https://solana.com/docs" target="_blank" rel="noopener noreferrer">
              Solana Docs
            </a>
            <a href="https://www.anchor-lang.com" target="_blank" rel="noopener noreferrer">
              Anchor
            </a>
            <a href="https://github.com/prashannaLeo/civic_streak_solana" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <p className="attribution">
            Built with <span className="highlight">Solana</span> + <span className="highlight">Anchor</span>
          </p>
        </div>
        
        <div className="footer-right">
          <a 
            href="https://github.com/prashannaLeo/civic_streak_solana" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-social"
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <About />;
      case 'how-it-works':
        return <HowItWorks />;
      case 'home':
      default:
        return <StreakComponent />;
    }
  };

  return (
    <WalletContextProvider>
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="main-content">
          {renderPage()}
        </main>
        <Footer />
      </div>
    </WalletContextProvider>
  );
}

export default App;

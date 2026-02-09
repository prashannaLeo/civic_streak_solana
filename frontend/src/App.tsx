import React from 'react';
import { WalletContextProvider } from './contexts/WalletProvider';
import { StreakComponent } from './components/StreakComponent';
import './index.css';

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

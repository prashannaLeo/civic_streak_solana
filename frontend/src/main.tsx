import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Buffer polyfill for Solana/Anchor in browser
import { Buffer } from 'buffer'
window.Buffer = Buffer

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

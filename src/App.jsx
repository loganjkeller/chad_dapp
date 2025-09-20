// src/App.jsx
import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";


import { useChainId } from "wagmi";
import { bsc } from "wagmi/chains";

// If you have a logo file, keep this import.
import logo from "./assets/chad_logo.png";

function resetWalletCacheAndOpen() {
  try {
    // Clear wagmi + walletconnect local storage keys only
    Object.keys(localStorage).forEach(k => {
      if (
        k.startsWith('wagmi') ||
        k.startsWith('wc:') ||
        k.startsWith('walletconnect')
      ) localStorage.removeItem(k);
    });
  } catch {}
  // Try to open Web3Modal
  const el = document.querySelector('w3m-button');
  if (el) el.click();
}

function clearStaleWalletSession() {
  try {
    const hasWC = Object.keys(localStorage).some((k) => k.startsWith('wc@2:'));
    const wagmiStore = localStorage.getItem('wagmi.store');

    // If wagmi or walletconnect think there's a session but no address in wagmi,
    // that’s a stale session -> clear it.
    let wagmiThinksConnected = false;
    if (wagmiStore) {
      try {
        const s = JSON.parse(wagmiStore);
        wagmiThinksConnected = s?.state?.data?.status === 'connected';
      } catch {}
    }
    if (hasWC || wagmiThinksConnected) {
      Object.keys(localStorage).forEach((k) => {
        if (k.includes('wagmi') || k.startsWith('wc@2:')) localStorage.removeItem(k);
      });
      console.log('🔄 Cleared stale wallet session');
    }
  } catch {}
}

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

// …inside App()
const { address: acct } = useAccount();

useEffect(() => {
  // If there’s no connected address but cache says “connected”, nuke cache.
  if (!acct) clearStaleWalletSession();
}, [acct]);

// Also when the tab regains focus (common on mobile after switching apps)
useEffect(() => {
  const onFocus = () => {
    if (!acct) clearStaleWalletSession();
  };
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, [acct]);	

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* Show logo if the file exists */}
          <img src={logo} alt="CHAD" className="brand-logo" />
          <span className="brand-title">CHADCOIN</span>

          <span className="netpill" style={{ color: onBnb ? "#9fd69f" : "#ffb3b3" }}>
            {onBnb ? "BNB Mainnet" : "Switch to BNB"}
          </span>
        </div>

        {/* Web3Modal’s connect button (registered in wallet.js) */}
        <w3m-button balance="hide"></w3m-button>
		
      </header>

      <main className="main">
        <PresalePanel />
	
      </main>

      <footer className="foot">
        <span>© {new Date().getFullYear()} CHADCOIN</span>
      </footer>
    </div>
  );
}

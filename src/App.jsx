// src/App.jsx
import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";


import { useChainId } from "wagmi";
import { bsc } from "wagmi/chains";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";

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
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const { open } = useWeb3Modal();


 const openModal = () => {
   try {
     // Open Web3Modal directly (reliable even if the button is hidden)
     open({ view: 'Connect' });
   } catch {
     // Fallbacks (rarely needed)
     document.querySelector("w3m-button")?.click();
     if (window?.ethereum?.request) {
       window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
     }
   }
 };
	
  const hardDisconnect = () => {
    try {
      disconnect?.(); // wagmi disconnect
      // also clean any lingering walletconnect/wagmi cache
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("wagmi") || k.startsWith("wc:") || k.startsWith("walletconnect")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  };	

  // Automatically clear stale sessions if no wallet is connected
  useEffect(() => {
    if (!address) {
      clearStaleWalletSession();
    }
  }, [address]);	

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

        {/* Keep the real Web3Modal button hidden; we drive it programmatically */}
        <w3m-button balance="hide" style={{ display: "none" }}></w3m-button>

        {isConnected ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={openModal} className="btn secondary" title="Manage wallet">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
            <button
              onClick={hardDisconnect}
              className="btn ghost"
              aria-label="Disconnect"
              title="Disconnect"
              style={{ padding: "6px 10px" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button onClick={openModal} className="btn">Connect Wallet</button>
        )}
		
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

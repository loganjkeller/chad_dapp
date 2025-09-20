// src/App.jsx
import "./wallet.js";          // createWeb3Modal runs here
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useEffect } from "react";
import { useChainId, useAccount, useDisconnect, useReconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();

  // Restore any existing WC/wagmi session after refresh/open
  useEffect(() => { reconnect(); }, [reconnect]);

  // Single place to open Web3Modal by clicking the HIDDEN w3m-button
  const openModal = () => {
    const el = document.getElementById("w3m-hidden");
    // Try clicking the real inner button (helps Safari / shadow-dom)
    try { el?.shadowRoot?.querySelector("button")?.click(); } catch {}
    // Fallback: click host element
    if (el) el.click();
    // Last resort: native provider prompt
    else if (window?.ethereum?.request) {
      window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
    }
  };

  const hardDisconnect = () => {
    try {
      disconnect?.();
      // Clear cached sessions so mobile browsers don't “ghost connect”
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("wagmi") || k.startsWith("wc:") || k.startsWith("walletconnect")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="CHAD" className="brand-logo" />
          <span className="brand-title">CHADCOIN</span>
          <span className="netpill" style={{ color: onBnb ? "#9fd69f" : "#ffb3b3" }}>
            {onBnb ? "BNB Mainnet" : "Switch to BNB"}
          </span>
        </div>

        {/* Keep exactly ONE Web3Modal element (hidden) in the whole app */}
        <w3m-button id="w3m-hidden" balance="hide" style={{ display: "none" }}></w3m-button>

        {/* Header wallet control */}
        <div className="wallet-wrap">
          {isConnected ? (
            <button className="addr-pill" onClick={openModal} title="Manage wallet" type="button">
              <span className="dot" />
              <span className="addr-text">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <span
                className="addr-x"
                onClick={(e) => { e.stopPropagation(); hardDisconnect(); }}
                aria-label="Disconnect"
                title="Disconnect"
              >
                ×
              </span>
            </button>
          ) : (
            <button className="btn connect" onClick={openModal} type="button">
              Connect Wallet
            </button>
          )}
        </div>
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

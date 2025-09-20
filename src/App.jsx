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

  // Restore any existing session on load (WC/wagmi)
  useEffect(() => { reconnect(); }, [reconnect]);

  async function openModal() {
    // 1) Ensure the custom element is registered
    if (!customElements.get("w3m-button")) {
      console.warn("Web3Modal <w3m-button> not defined yet — check wallet.js & VITE_WC_PROJECT_ID");
      // wait briefly in case wallet.js is still loading
      await new Promise(r => setTimeout(r, 50));
    }

    // 2) Wait until the element is actually in the DOM
    let el = document.getElementById("w3m-hidden");
    if (!el) {
      await new Promise(r => setTimeout(r, 50));
      el = document.getElementById("w3m-hidden");
    }

    // 3) Try hard: click inner shadow button (Safari), then host
    try { el?.shadowRoot?.querySelector("button")?.click(); } catch {}
    if (el) {
      el.click();
      // give it one more nudge after render
      setTimeout(() => {
        try { el.shadowRoot?.querySelector("button")?.click(); } catch {}
      }, 50);
      return;
    }

    // 4) Last-resort fallback: native provider prompt
    if (window?.ethereum?.request) {
      try { await window.ethereum.request({ method: "eth_requestAccounts" }); } catch {}
    }
  }

  function hardDisconnect() {
    try {
      disconnect?.();
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("wagmi") || k.startsWith("wc:") || k.startsWith("walletconnect")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }

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

        {/* Exactly one Web3Modal element; hidden but clickable programmatically */}
        <w3m-button id="w3m-hidden" balance="hide" style={{ display: "none" }}></w3m-button>

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

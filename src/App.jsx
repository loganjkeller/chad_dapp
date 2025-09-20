// src/App.jsx
import "./wallet.js";          // Web3Modal init happens here
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useEffect } from "react";
import { useChainId, useAccount, useDisconnect, useReconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

/** Wait for the hidden <w3m-button> to be defined & in the DOM, then click it */
async function openModalViaHiddenButton() {
  // 1) Wait until the custom element is defined (in case it loads a bit later)
  if (!customElements.get("w3m-button")) {
    try {
      await customElements.whenDefined("w3m-button");
    } catch {}
  }

  // 2) Find the *one* hidden button we render in App.jsx
  const el = document.getElementById("w3m-hidden");

  if (el) {
    // Try clicking the inner real button (helps Safari)
    try { el.shadowRoot?.querySelector("button")?.click(); } catch {}
    // Click the element itself as well (covers other browsers)
    el.click();
    return;
  }

  // 3) Last fallback: open MetaMask native prompt
  if (window?.ethereum?.request) {
    window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
  }
}

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();

  // Try to restore the session on refresh/open
  useEffect(() => { reconnect(); }, [reconnect]);

  function openModal() {
    openModalViaHiddenButton();
  }

  function hardDisconnect() {
    try {
      disconnect?.();
      // Clear cached sessions (wagmi + walletconnect)
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

        {/* Keep exactly ONE hidden Web3Modal button in the app */}
        <w3m-button id="w3m-hidden" balance="hide" style={{ display: "none" }}></w3m-button>

        {/* Connect / Address */}
        <div className="wallet-wrap">
          {isConnected ? (
            <button
              className="addr-pill"
              onClick={openModal}
              title="Manage wallet"
              type="button"
            >
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

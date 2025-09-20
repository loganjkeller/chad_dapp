// src/App.jsx
import "./wallet.js";          // must run first (calls createWeb3Modal)
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useChainId, useAccount, useDisconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

// Minimal opener: click the ONE hidden w3m-button; fallback to MetaMask request
function openModal() {
  const el = document.getElementById("w3m-hidden");
  if (el) {
    try { el.shadowRoot?.querySelector("button")?.click(); } catch {}
    try { el.click(); } catch {}
    return;
  }
  if (window?.ethereum?.request) {
    window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
  }
}

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const hardDisconnect = () => {
    try {
      disconnect?.();
      // clear cached sessions so reconnect works cleanly
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

        {/* Keep exactly ONE hidden Web3Modal button in the whole app */}
        <w3m-button
          id="w3m-hidden"
          balance="hide"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: 0,
            height: 0,
            opacity: 0,
            visibility: "hidden"
          }}
        ></w3m-button>

        {/* Header wallet control */}
        <div className="wallet-wrap">
          {isConnected ? (
            <button
              className="addr-pill"
              onClick={openModal}
              title="Manage wallet"
              type="button"
            >
              <span className="dot" />
              <span className="addr-text">{address.slice(0, 6)}…{address.slice(-4)}</span>
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

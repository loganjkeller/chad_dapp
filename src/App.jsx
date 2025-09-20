// src/App.jsx
import "./wallet.js";          // ensures createWeb3Modal() runs
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useChainId, useAccount, useDisconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const hardDisconnect = () => {
    try {
      disconnect?.();
      Object.keys(localStorage).forEach(k => {
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

        {/* One single Web3Modal button, used as an invisible hotspot */}
        <div className="wallet-wrap hotspot">
          {/* Pretty pill (visible) */}
          {isConnected ? (
            <div className="addr-pill" title="Manage wallet">
              <span className="dot" />
              <span className="addr-text">{address.slice(0, 6)}…{address.slice(-4)}</span>
              <button
                className="addr-x"
                onClick={(e) => { e.stopPropagation(); hardDisconnect(); }}
                aria-label="Disconnect"
                title="Disconnect"
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="btn connect" type="button">
              Connect Wallet
            </button>
          )}

          {/* Invisible but clickable Web3Modal element sitting under the pill */}
          <w3m-button
            id="w3m-hotspot"
            balance="hide"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              pointerEvents: "auto" // it captures clicks
            }}
          ></w3m-button>
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

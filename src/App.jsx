// src/App.jsx
import "./wallet.js";
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

        {/* Connect / Address */}
        {isConnected ? (
          <div className="wallet-wrap">
            <button
              className="wallet-pill"
              title="Connected wallet"
              type="button"
            >
              {address.slice(0, 6)}…{address.slice(-4)}
            </button>
            <button
              className="wallet-x"
              onClick={() => disconnect?.()}
              title="Disconnect"
              aria-label="Disconnect"
              type="button"
            >
              ✕
            </button>
          </div>
        ) : (
          <w3m-button balance="hide"></w3m-button>
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

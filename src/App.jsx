// src/App.jsx
import "./wallet.js";          // your Web3Modal init (createWeb3Modal) lives here
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

  // Robust "open modal" (works on Safari/iOS)
  const openModal = () => {
    const host = document.getElementById("w3m-hidden");
    if (host) {
      try {
        // click the real button inside shadow DOM first
        host.shadowRoot?.querySelector("button")?.click();
      } catch {}
      host.click(); // fallback
      return;
    }
    // final fallback: native provider prompt
    if (window?.ethereum?.request) {
      window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
    }
  };

  const hardDisconnect = () => {
    try {
      disconnect?.(); // wagmi disconnect
      // clear wagmi + walletconnect cache
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

        {/* Keep exactly ONE Web3Modal button in the app. Hide it visually but keep it in layout. */}
        <w3m-button
          id="w3m-hidden"
          balance="hide"
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
            overflow: "hidden"
          }}
        ></w3m-button>

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

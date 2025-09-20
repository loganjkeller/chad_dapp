// src/App.jsx
import "./wallet.js";          // Web3Modal init (createWeb3Modal) happens here
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useChainId, useAccount, useDisconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

// Robust, browser-safe opener for the Web3Modal
async function openModal() {
  // ensure the custom element is registered
  if (!customElements.get("w3m-button")) {
    try { await customElements.whenDefined("w3m-button"); } catch {}
  }

  // find our hidden instance (retry briefly)
  let el = document.getElementById("w3m-hidden");
  const t0 = Date.now();
  while (!el && Date.now() - t0 < 1200) {
    await new Promise(r => setTimeout(r, 50));
    el = document.getElementById("w3m-hidden");
  }

  if (el) {
    // Safari-friendly: click the inner real button first
    try { el.shadowRoot?.querySelector("button")?.click(); } catch {}
    // fallback: click host
    try { el.click(); } catch {}
    return;
  }

  // last fallback: native provider prompt
  if (window?.ethereum?.request) {
    window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
  }
}

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // optional: stronger disconnect that also clears cached WC/wagmi keys
  function hardDisconnect() {
    try {
      disconnect?.();
      Object.keys(localStorage).forEach(k => {
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

        {/* Keep one Web3Modal element rendered (off-screen but present) */}
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

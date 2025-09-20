// src/App.jsx
import "./wallet.js";          // Web3Modal init (createWeb3Modal) happens here
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useChainId, useAccount, useDisconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import { useWeb3Modal } from "@web3modal/wagmi/react"; // ✅ use the official opener
import logo from "./assets/chad_logo.png";

// robust opener: try Web3Modal API → hidden button → MetaMask fallback
async function openModalSafe(openW3M) {
  try {
    if (typeof openW3M === "function") {
      await openW3M({ view: "Connect" });
      return;
    }
  } catch {} // if hook not ready, fall through

  // fallback to clicking our hidden w3m-button
  try {
    // ensure the custom element is defined
    if (!customElements.get("w3m-button")) {
      try { await customElements.whenDefined("w3m-button"); } catch {}
    }
    let el = document.getElementById("w3m-hidden");
    const t0 = Date.now();
    while (!el && Date.now() - t0 < 800) {
      await new Promise(r => setTimeout(r, 40));
      el = document.getElementById("w3m-hidden");
    }
    if (el) {
      try { el.shadowRoot?.querySelector("button")?.click(); } catch {}
      el.click();
      return;
    }
  } catch {}

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
  const { open } = useWeb3Modal();             // ✅ get Web3Modal opener

  // header button handlers
  const onOpenClick = () => openModalSafe(open);
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

        {/* Keep exactly ONE hidden Web3Modal button for fallback clicks */}
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
              onClick={onOpenClick}
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
            <button className="btn connect" onClick={onOpenClick} type="button">
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

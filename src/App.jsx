// src/App.jsx
import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";


import { useChainId } from "wagmi";
import { bsc } from "wagmi/chains";

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

function resetWalletCache() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.includes("wagmi") || k.includes("wc@2")) {
        localStorage.removeItem(k);
      }
    });
    console.log("🔄 Cleared wallet session cache");
  } catch (err) {
    console.warn("Could not clear wallet cache", err);
  }
}

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

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

        {/* Web3Modal’s connect button (registered in wallet.js) */}
        <w3m-button balance="hide"></w3m-button>
		
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

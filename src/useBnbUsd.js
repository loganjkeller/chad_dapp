import { useEffect, useState } from "react";

// Simple price fetcher (polls every 30s).
export default function useBnbUsd() {
  const [usd, setUsd] = useState(null);

  async function load() {
    try {
      // CoinGecko simple price endpoint
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
      );
      const j = await r.json();
      const v = j?.binancecoin?.usd;
      if (typeof v === "number") setUsd(v);
    } catch (e) {
      console.error("BNB/USD fetch failed", e);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return usd; // number | null
}

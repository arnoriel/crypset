"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h_in_currency: number;
  market_cap: number;
  sparkline_in_7d: { price: number[] };
}

interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
}

interface Holding {
  coinId: string;
  amount: number;
  buyPrice: number;
  name?: string;
  symbol?: string;
  image?: string;
}

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_KEY = 'marketViewCoinsCache';
const CACHE_TIME = 60000; // 1 minute in ms

export default function MarketViewPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase();
  const router = useRouter();

  const [coins, setCoins] = useState<Coin[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  // Load portfolios from localStorage
  useEffect(() => {
    const lastUser = localStorage.getItem("cryptoLastUser");
    if (lastUser) {
      const userKey = `cryptoUser_${lastUser.toLowerCase().trim()}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const data = JSON.parse(saved);
        setPortfolios(data.portfolios || []);
      }
    }
  }, []);

  // Fetch coins with cache
  useEffect(() => {
    const fetchCoins = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
          setCoins(data);
          setLoadingCoins(false);
          return;
        }
      }

      try {
        const res = await fetch(
          `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
        );
        const data = await res.json();
        setCoins(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        setLoadingCoins(false);
      } catch (e) {
        console.error(e);
        setLoadingCoins(false);
      }
    };
    fetchCoins();
  }, []);

  // Set selected coin based on symbol
  useEffect(() => {
    if (symbol && coins.length > 0) {
      const coin = coins.find((c) => c.symbol.toUpperCase() === symbol);
      if (coin) {
        setSelectedCoin(coin);
      }
    }
  }, [symbol, coins]);

  const getChangeColor = useCallback(
    (change: number) =>
      change > 0
        ? "text-green-400"
        : change < 0
        ? "text-red-400"
        : "text-gray-400",
    []
  );

  const handleCoinClick = useCallback(
    (newSymbol: string) => {
      router.push(`/marketview/${newSymbol.toUpperCase()}`);
    },
    [router]
  );

  const handleSaveHolding = useCallback(() => {
    if (!selectedCoin || !selectedPortfolioId || !amount || !buyPrice) return;

    const newHolding: Holding = {
      coinId: selectedCoin.id,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      name: selectedCoin.name,
      symbol: selectedCoin.symbol,
      image: selectedCoin.image,
    };

    setPortfolios((prev) => {
      const updatedPortfolios = prev.map((p) =>
        p.id === selectedPortfolioId
          ? { ...p, holdings: [...p.holdings, newHolding] }
          : p
      );

      // Save to localStorage
      const lastUser = localStorage.getItem("cryptoLastUser");
      if (lastUser) {
        const userKey = `cryptoUser_${lastUser.toLowerCase().trim()}`;
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const data = JSON.parse(saved);
          data.portfolios = updatedPortfolios;
          localStorage.setItem(userKey, JSON.stringify(data));
        }
      }

      const listName = updatedPortfolios.find((p) => p.id === selectedPortfolioId)?.name || "";
      toast.success(`Successfully added to '${listName}' list`);

      return updatedPortfolios;
    });

    setShowAddModal(false);
    setAmount("");
    setBuyPrice("");
    setSelectedPortfolioId("");
  }, [selectedCoin, selectedPortfolioId, amount, buyPrice]);

  useEffect(() => {
    if (!symbol) return;

    // Bersihkan container widget sebelum membuat yang baru agar tidak duplikat saat navigasi
    const container = document.getElementById("tradingview_widget");
    if (container) container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined") {
        interface TradingViewWindow extends Window {
          TradingView?: {
            widget: new (options: object) => unknown;
          };
        }
        const tvWindow = window as TradingViewWindow;
        if (tvWindow.TradingView) {
          new tvWindow.TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${symbol}USDT`,
            interval: "60",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            withdateranges: true,
            hide_side_toolbar: false,
            container_id: "tradingview_widget",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if(document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [symbol]);

  if (!symbol) {
    return <div className="container mx-auto p-4">Invalid symbol</div>;
  }

  return (
    <div className="w-full p-2 md:p-4 min-h-screen flex flex-col">
      {/* Header Back Button */}
      <button
        onClick={() => router.push('/')}
        className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 px-2"
      >
        <ArrowLeft size={18} /> Back to Homepage
      </button>

      {/* Main Content Grid: Flex Col on Mobile, Flex Row on Desktop */}
      <div className="flex flex-col md:flex-row gap-4 h-full">
        
        {/* 1. CHART SECTION (Top on mobile, Left on desktop) */}
        <div className="w-full md:w-3/4">
          {/* FIX: Menggunakan class tailwind untuk tinggi responsif, bukan inline style */}
          <div
            className="tradingview-widget-container w-full rounded-lg overflow-hidden h-[50vh] md:h-[80vh]"
          >
             <div id="tradingview_widget" className="h-full w-full" />
          </div>
        </div>

        {/* 2. SIDEBAR SECTION (Bottom on mobile, Right on desktop) */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          
          {/* BUTTON ADD INVESTMENT (Middle position on mobile) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-blue-600 px-4 py-3 md:py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold shadow-lg"
            disabled={!selectedCoin || portfolios.length === 0}
          >
            <Plus size={20} /> Add Investment
          </button>

          {/* COIN LIST (Bottom position on mobile) */}
          {loadingCoins ? (
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/50 flex-grow">
              {/* List scrollable area - Tinggi disesuaikan agar pas di desktop dan mobile */}
              <div className="overflow-y-auto max-h-[40vh] md:max-h-[calc(80vh-60px)]">
                <table className="w-full table-auto">
                  <thead className="bg-gray-800 sticky top-0 z-10 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="p-3 text-left">Coin</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">24h</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {coins.map((coin) => (
                      <tr
                        key={coin.id}
                        className={`border-b border-gray-800 hover:bg-gray-800 transition cursor-pointer ${
                          coin.symbol.toUpperCase() === symbol ? "bg-gray-800 border-l-2 border-l-blue-500" : ""
                        }`}
                        onClick={() => handleCoinClick(coin.symbol)}
                      >
                        <td className="p-3 flex items-center">
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            className="mr-3 rounded-full"
                            loading="lazy"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold">{coin.symbol.toUpperCase()}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[80px] md:max-w-full">{coin.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          ${coin.current_price.toLocaleString()}
                        </td>
                        <td
                          className={`p-3 text-right ${getChangeColor(
                            coin.price_change_percentage_24h_in_currency
                          )}`}
                        >
                          {coin.price_change_percentage_24h_in_currency?.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to Portfolio Modal (Tidak ada perubahan di sini) */}
      {showAddModal && selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-5 md:p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Investment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 flex items-center gap-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <Image src={selectedCoin.image} alt={selectedCoin.name} width={40} height={40} />
              <div>
                <p className="font-bold text-lg">{selectedCoin.name} <span className="text-gray-400 text-sm">({selectedCoin.symbol.toUpperCase()})</span></p>
                <p className="text-blue-400 font-mono">
                  ${selectedCoin.current_price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm text-gray-400">Select Portfolio List</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 px-3 py-3 rounded focus:outline-none focus:border-blue-500"
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
              >
                <option value="" disabled>Choose a portfolio...</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm text-gray-400">Amount Owned</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 px-3 py-3 rounded focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 0.5"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm text-gray-400">Avg Buy Price (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 px-3 py-3 rounded focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 65000"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveHolding}
                disabled={!selectedPortfolioId || !amount || !buyPrice}
                className="flex-1 bg-blue-600 px-4 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Save Asset
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 px-4 py-3 rounded font-semibold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

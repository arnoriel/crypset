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

  // Load portfolios from localStorage (removed unused watchlist loading)
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
            interval: "60", // Default ke 1 jam (60 menit)
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            withdateranges: true, // Aktifkan date range selector
            hide_side_toolbar: false,
            container_id: "tradingview_widget",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [symbol]);

  if (!symbol) {
    return <div className="container mx-auto p-4">Invalid symbol</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <button
        onClick={() => router.push('/')}
        className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"
      >
        <ArrowLeft size={18} /> Back to Homepage
      </button>
      <div className="flex flex-row gap-4">
        <div className="w-3/4">
          <div
            className="tradingview-widget-container"
            style={{ height: "80vh", width: "100%" }}
          >
            <div id="tradingview_widget" style={{ height: "100%" }} />
          </div>
        </div>
        <div className="w-1/4">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 mb-4"
            disabled={!selectedCoin || portfolios.length === 0}
          >
            <Plus size={18} /> Add Investment
          </button>
          {loadingCoins ? (
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[80vh]">
                <table className="w-full table-auto">
                  <thead className="bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">24h %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin) => (
                      <tr
                        key={coin.id}
                        className="border-b border-gray-700 hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => handleCoinClick(coin.symbol)}
                      >
                        <td className="p-3 flex items-center">
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            className="mr-3"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-gray-400">
                              {coin.symbol.toUpperCase()}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          ${coin.current_price.toFixed(2)}
                        </td>
                        <td
                          className={`p-3 text-right ${getChangeColor(
                            coin.price_change_percentage_24h_in_currency
                          )}`}
                        >
                          {coin.price_change_percentage_24h_in_currency?.toFixed(2)}%
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

      {/* Add to Portfolio Modal */}
      {showAddModal && selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">Add Investment to {selectedCoin.name}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 bg-gray-700 p-3 rounded">
              <Image src={selectedCoin.image} alt={selectedCoin.name} width={32} height={32} />
              <div>
                <p>{selectedCoin.name}</p>
                <p className="text-sm text-gray-400">
                  ${selectedCoin.current_price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Select List</label>
              <select
                className="w-full bg-gray-700 px-3 py-2 rounded"
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
              >
                <option value="" disabled>Select a list</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Amount</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded"
                  placeholder="0.5"
                />
              </div>
              <div>
                <label className="block mb-1">Buy Price (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded"
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveHolding}
                disabled={!selectedPortfolioId || !amount || !buyPrice}
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
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

"use client";
import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Image from "next/image";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  LogOut,
  User,
} from "lucide-react";
import AddHoldingModal from "./components/AddHoldingModal";
import NewListModal from "./components/NewListModal";
import dynamic from "next/dynamic";

const WatchlistSection = dynamic(() => import("./components/WatchlistSection"), {
  loading: () => (
    <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
  ),
  ssr: false,
});
const TrendingSection = dynamic(() => import("./components/TrendingSection"), {
  loading: () => <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />,
  ssr: false,
});
const FullTableSection = dynamic(() => import("./components/FullTableSection"), {
  loading: () => (
    <div className="h-screen bg-gray-800 rounded-lg animate-pulse" />
  ),
  ssr: false,
});

// ====================== TYPES ======================
interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: { price: number[] };
}
interface GlobalData {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number };
    market_cap_change_percentage_24h_usd: number;
  };
}
interface Trending {
  coins: { item: { id: string; name: string; symbol: string; thumb: string } }[];
}
interface Holding {
  coinId: string;
  amount: number;
  buyPrice: number;
  name?: string;
  symbol?: string;
  image?: string;
}
interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
}
interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
}
interface UserData {
  profile: UserProfile;
  portfolios: Portfolio[];
  watchlist: string[];
}
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export default function Home() {
  // ====================== STATE ======================
  const [coins, setCoins] = useState<Coin[]>([]);
  const [allCoinsSearch, setAllCoinsSearch] = useState<Coin[]>([]);
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [trending, setTrending] = useState<Trending | null>(null);
  const [globalWatchlist, setGlobalWatchlist] = useState<string[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Optimize: Create a map for quick coin lookup
  const coinsMap = useMemo(() => {
    const map = new Map<string, Coin>();
    coins.forEach((coin) => map.set(coin.id, coin));
    return map;
  }, [coins]);

  // ====================== LOCALSTORAGE HELPERS ======================
  const getUserKey = useCallback((name: string) =>
    `cryptoUser_${name.toLowerCase().trim()}`, []);

  const saveUserData = useCallback((name: string) => {
    const key = getUserKey(name);
    const data: UserData = {
      profile: userProfile!,
      portfolios,
      watchlist: globalWatchlist,
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, [userProfile, portfolios, globalWatchlist, getUserKey]);

  const loadUserData = useCallback((name: string) => {
    const key = getUserKey(name);
    const saved = localStorage.getItem(key);
    if (saved) {
      const data: UserData = JSON.parse(saved);
      setUserProfile(data.profile);
      setPortfolios(data.portfolios || []);
      setGlobalWatchlist(data.watchlist || []);
      if (data.portfolios.length > 0) {
        setSelectedPortfolioId(data.portfolios[0].id);
      }
    }
  }, [getUserKey]);

  // ====================== FETCH DATA ======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coinsRes, searchRes, globalRes, trendingRes] = await Promise.all([
          fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`),
          fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`),
          fetch(`${COINGECKO_BASE_URL}/global`),
          fetch(`${COINGECKO_BASE_URL}/search/trending`),
        ]);
        const [coinsData, searchData, globalData, trendingData] = await Promise.all([
          coinsRes.json(),
          searchRes.json(),
          globalRes.json(),
          trendingRes.json(),
        ]);
        setCoins(coinsData);
        setAllCoinsSearch(searchData);
        setGlobal(globalData);
        setTrending(trendingData);
        const lastUser = localStorage.getItem("cryptoLastUser");
        if (lastUser) {
          loadUserData(lastUser);
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchData();
  }, [loadUserData]);

  // ====================== SAVE ON CHANGE ======================
  useEffect(() => {
    if (!loading && userProfile) {
      saveUserData(userProfile.name);
      localStorage.setItem("cryptoLastUser", userProfile.name);
    }
  }, [globalWatchlist, portfolios, userProfile, loading, saveUserData]);

  // ====================== HELPERS ======================
  const toggleGlobalWatchlist = useCallback((coinId: string) => {
    setGlobalWatchlist((prev) =>
      prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId]
    );
  }, []);

  const formatNumber = useCallback((num: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(num), []);

  const getChangeColor = useCallback((change: number) =>
    change > 0
      ? "text-green-400"
      : change < 0
      ? "text-red-400"
      : "text-gray-400", []);

  // ====================== PORTFOLIO CALC ======================
  const currentPortfolio = useMemo(
    () => portfolios.find((p) => p.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId]
  );

  const { portfolioValue, portfolioCost, portfolioPnL, portfolioPnLPercent } =
    useMemo(() => {
      if (!currentPortfolio)
        return {
          portfolioValue: 0,
          portfolioCost: 0,
          portfolioPnL: 0,
          portfolioPnLPercent: 0,
        };
      let value = 0,
        cost = 0;
      currentPortfolio.holdings.forEach((h) => {
        const coin = coinsMap.get(h.coinId);
        const price = coin?.current_price || 0;
        value += price * h.amount;
        cost += h.buyPrice * h.amount;
      });
      const pnl = value - cost;
      const pct = cost ? (pnl / cost) * 100 : 0;
      return {
        portfolioValue: value,
        portfolioCost: cost,
        portfolioPnL: pnl,
        portfolioPnLPercent: pct,
      };
    }, [currentPortfolio, coinsMap]);

  // ====================== HANDLERS ======================
  const createPortfolio = useCallback((name: string) => {
    if (!name.trim()) return;
    const newPort: Portfolio = {
      id: Date.now().toString(),
      name,
      holdings: [],
    };
    setPortfolios((prev) => [...prev, newPort]);
    setShowNewListModal(false);
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      const lastPortfolio = portfolios[portfolios.length - 1];
      if (
        !selectedPortfolioId ||
        !portfolios.find((p) => p.id === selectedPortfolioId)
      ) {
        setSelectedPortfolioId(lastPortfolio.id);
      }
    }
  }, [portfolios, selectedPortfolioId]);

  const deletePortfolio = useCallback(
    (id: string) => {
      setPortfolios((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        if (selectedPortfolioId === id) {
          setSelectedPortfolioId(filtered[0]?.id || null);
        }
        return filtered;
      });
    },
    [selectedPortfolioId]
  );

  const handleSaveHolding = useCallback(
    (holding: Holding) => {
      if (!currentPortfolio) return;
      if (editingHolding) {
        setPortfolios((prev) =>
          prev.map((p) =>
            p.id === currentPortfolio.id
              ? {
                  ...p,
                  holdings: p.holdings.map((h) =>
                    h.coinId === holding.coinId ? { ...h, ...holding } : h
                  ),
                }
              : p
          )
        );
      } else {
        setPortfolios((prev) =>
          prev.map((p) =>
            p.id === currentPortfolio.id
              ? { ...p, holdings: [...p.holdings, holding] }
              : p
          )
        );
      }
      setEditingHolding(null);
      setShowAddHoldingModal(false);
    },
    [currentPortfolio, editingHolding]
  );

  const removeHolding = useCallback(
    (coinId: string) => {
      if (!currentPortfolio) return;
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === currentPortfolio.id
            ? { ...p, holdings: p.holdings.filter((h) => h.coinId !== coinId) }
            : p
        )
      );
    },
    [currentPortfolio]
  );

  const openEditHolding = useCallback((holding: Holding) => {
    setEditingHolding(holding);
    setShowAddHoldingModal(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddHoldingModal(false);
    setEditingHolding(null);
  }, []);

  const saveProfile = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newName = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const bio = (form.elements.namedItem("bio") as HTMLTextAreaElement).value;
    const file = (form.elements.namedItem("avatar") as HTMLInputElement).files?.[0];
    if (!newName) return;

    const oldName = userProfile?.name;
    const handleSave = (avatar: string) => {
      const newProfile = { name: newName, bio, avatar };
      setUserProfile(newProfile);
      setAvatarPreview(null);
      setShowProfileModal(false);

      if (oldName && oldName !== newName) {
        const oldKey = getUserKey(oldName);
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          const data: UserData = JSON.parse(oldData);
          data.profile = newProfile;
          const newKey = getUserKey(newName);
          localStorage.setItem(newKey, JSON.stringify(data));
          localStorage.removeItem(oldKey);
        }
      }
      localStorage.setItem("cryptoLastUser", newName);
      loadUserData(newName);
    };

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSave(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      handleSave(userProfile?.avatar || "");
    }
  }, [userProfile, getUserKey, loadUserData]);

  const signOut = useCallback(() => {
    setUserProfile(null);
    setPortfolios([]);
    setGlobalWatchlist([]);
    setSelectedPortfolioId(null);
    localStorage.removeItem("cryptoLastUser");
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-2xl">
        Loading...
      </div>
    );

  // ====================== RENDER ======================
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Crypset</h1>
        <div className="flex items-center gap-4">
          {userProfile ? (
            <div className="flex items-center gap-3">
              {userProfile.avatar && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600">
                  <Image
                    src={userProfile.avatar}
                    alt="avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium">{userProfile.name}</p>
                <p className="text-sm text-gray-400">
                  {userProfile.bio || "No bio"}
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={signOut}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <User size={18} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* Global Stats */}
      {global && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Total Market Cap</h2>
            <p className="text-2xl">
              ${formatNumber(global.data.total_market_cap.usd)}
            </p>
            <p className={getChangeColor(global.data.market_cap_change_percentage_24h_usd)}>
              {global.data.market_cap_change_percentage_24h_usd?.toFixed(2) ?? "0.00"}%
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">24h Volume</h2>
            <p className="text-2xl">
              ${formatNumber(global.data.total_volume.usd)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">BTC Dominance</h2>
            <p className="text-2xl">
              {global.data.market_cap_percentage.btc.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Portfolios</h2>
            <button
              onClick={() => setShowNewListModal(true)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
            >
              <Plus size={16} /> New List
            </button>
          </div>
        </section>
      )}

      {/* Portfolio Tabs & Summary */}
      {portfolios.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-wrap gap-3 border-b border-gray-700">
            {portfolios.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition cursor-pointer ${
                  selectedPortfolioId === p.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                onClick={() => setSelectedPortfolioId(p.id)}
              >
                <span className="truncate max-w-48">{p.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePortfolio(p.id);
                  }}
                  className="text-red-400 hover:text-red-300 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          {currentPortfolio && (
            <div className="bg-gray-800 p-4 rounded-lg mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-gray-400">Total Value</p>
                <p className="text-2xl font-bold">
                  ${portfolioValue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Cost</p>
                <p className="text-xl">${portfolioCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400">PnL</p>
                <p
                  className={`text-xl font-bold ${
                    portfolioPnL >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ${portfolioPnL.toFixed(2)} ({portfolioPnLPercent.toFixed(2)}%)
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingHolding(null);
                  setShowAddHoldingModal(true);
                }}
                className="ml-auto bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Add Investment
              </button>
            </div>
          )}
          {/* Holdings Table */}
          {currentPortfolio && currentPortfolio.holdings.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-2 text-left">Asset</th>
                    <th className="p-2 text-right">Holdings</th>
                    <th className="p-2 text-right">Avg Buy</th>
                    <th className="p-2 text-right">Current Price</th>
                    <th className="p-2 text-right">Value</th>
                    <th className="p-2 text-right">PnL</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentPortfolio.holdings.map((h) => (
                    <HoldingRow key={h.coinId} h={h} coinsMap={coinsMap} openEditHolding={openEditHolding} removeHolding={removeHolding} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            currentPortfolio && (
              <p className="text-gray-400 mt-4">
                No holdings yet. Click &quot;Add Investment&quot; to start.
              </p>
            )
          )}
        </section>
      )}

      {/* === LAZY LOADED SECTIONS === */}
      <Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
        <WatchlistSection
          coins={coins}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
          formatNumber={formatNumber}
          getChangeColor={getChangeColor}
        />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-gray-800 rounded-lg animate-pulse" />}>
        <TrendingSection
          trending={trending}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
        />
      </Suspense>

      <Suspense fallback={<div className="h-screen bg-gray-800 rounded-lg animate-pulse" />}>
        <FullTableSection
          coins={coins}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
          formatNumber={formatNumber}
          getChangeColor={getChangeColor}
        />
      </Suspense>

      {/* ==================== MODALS ==================== */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl mb-4">
              {userProfile ? "Edit Profile" : "Create Profile"}
            </h2>
            <form onSubmit={saveProfile}>
              <div className="mb-4">
                <label className="block mb-1">Name</label>
                <input
                  name="name"
                  required
                  className="w-full bg-gray-700 px-3 py-2 rounded"
                  defaultValue={userProfile?.name || ""}
                  placeholder="Your name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  className="w-full bg-gray-700 px-3 py-2 rounded"
                  defaultValue={userProfile?.bio || ""}
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Profile Picture</label>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="w-full mb-3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setAvatarPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {(avatarPreview || userProfile?.avatar) && (
                  <div className="flex justify-center my-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl">
                      <Image
                        src={avatarPreview || userProfile?.avatar || ""}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setAvatarPreview(null);
                  }}
                  className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NewListModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        onCreate={createPortfolio}
      />

      <AddHoldingModal
        isOpen={showAddHoldingModal}
        onClose={closeAddModal}
        onSave={handleSaveHolding}
        editingHolding={editingHolding}
        allCoins={allCoinsSearch}
      />
    </div>
  );
}

// === HoldingRow dipindah ke sini biar page.tsx ga import Recharts ===
const HoldingRow = React.memo(function HoldingRow({ 
  h, 
  coinsMap, 
  openEditHolding, 
  removeHolding 
}: { 
  h: Holding; 
  coinsMap: Map<string, Coin>; 
  openEditHolding: (h: Holding) => void; 
  removeHolding: (coinId: string) => void; 
}) {
  const coin = coinsMap.get(h.coinId);
  const cur = coin?.current_price || 0;
  const value = cur * h.amount;
  const cost = h.buyPrice * h.amount;
  const pnl = value - cost;
  const pnlPct = cost ? (pnl / cost) * 100 : 0;
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800">
      <td className="p-2 flex items-center">
        {h.image && <Image src={h.image} alt={h.name || ""} width={24} height={24} className="mr-2" loading="lazy" />}
        {h.name} ({h.symbol?.toUpperCase()})
      </td>
      <td className="p-2 text-right">{h.amount}</td>
      <td className="p-2 text-right">${h.buyPrice.toFixed(2)}</td>
      <td className="p-2 text-right">${cur.toFixed(2)}</td>
      <td className="p-2 text-right">${value.toFixed(2)}</td>
      <td className={`p-2 text-right ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
        ${pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
      </td>
      <td className="p-2 text-center flex gap-2 justify-center">
        <button onClick={() => openEditHolding(h)} className="text-blue-400">
          <Edit2 size={16} />
        </button>
        <button onClick={() => removeHolding(h.coinId)} className="text-red-400">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
});

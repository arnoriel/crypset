"use client";
import React, { useEffect, useState, useMemo, useCallback, Suspense, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  User,
  ChevronDown,
} from "lucide-react";
import AddHoldingModal from "./components/AddHoldingModal";
import NewListModal from "./components/NewListModal";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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
const CACHE_KEY = 'cryptoDataCache';
const CACHE_TIME = 60000; // 1 minute in ms

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

export default function Home() {
  // ====================== STATE ======================
  const [coins, setCoins] = useState<Coin[]>([]);
  const [allCoinsSearch, setAllCoinsSearch] = useState<Coin[]>([]);
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [trending, setTrending] = useState<Trending | null>(null);
  const [globalWatchlist, setGlobalWatchlist] = useState<string[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State Greeting (Fitur Baru)
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  
  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Optimize: Create a map for quick coin lookup
  const coinsMap = useMemo(() => {
    const map = new Map<string, Coin>();
    coins.forEach((coin) => map.set(coin.id, coin));
    return map;
  }, [coins]);

  const handleCoinClick = useCallback(
    (symbol: string) => {
      router.push(`/marketview/${symbol.toUpperCase()}`);
    },
    [router]
  );

  // ====================== EFFECT GREETING TIME ======================
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    };

    updateTime();
  }, []);

  // ====================== CLICK OUTSIDE LISTENER ======================
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ====================== LOCALSTORAGE HELPERS ======================
  const getUserKey = useCallback(
    (name: string) => `cryptoUser_${name.toLowerCase().trim()}`,
    []
  );

  const saveUserData = useCallback(
    (name: string) => {
      const key = getUserKey(name);
      const data: UserData = {
        profile: userProfile!,
        portfolios,
        watchlist: globalWatchlist,
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    [userProfile, portfolios, globalWatchlist, getUserKey]
  );

  const loadUserData = useCallback(
    (name: string) => {
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
    },
    [getUserKey]
  );

  // ====================== FETCH DATA WITH CACHE ======================
  useEffect(() => {
    const fetchData = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
          setCoins(data.coinsData);
          setAllCoinsSearch(data.searchData);
          setGlobal(data.globalData);
          setTrending(data.trendingData);
          setLoading(false);
          const lastUser = localStorage.getItem("cryptoLastUser");
          if (lastUser) {
            loadUserData(lastUser);
          }
          return;
        }
      }

      try {
        const [coinsRes, searchRes, globalRes, trendingRes] = await Promise.all(
          [
            fetch(
              `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
            ),
            fetch(
              `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`
            ),
            fetch(`${COINGECKO_BASE_URL}/global`),
            fetch(`${COINGECKO_BASE_URL}/search/trending`),
          ]
        );
        const [coinsData, searchData, globalData, trendingData] =
          await Promise.all([
            coinsRes.json(),
            searchRes.json(),
            globalRes.json(),
            trendingRes.json(),
          ]);
        setCoins(coinsData);
        setAllCoinsSearch(searchData);
        setGlobal(globalData);
        setTrending(trendingData);

        const cacheData = {
          coinsData,
          searchData,
          globalData,
          trendingData,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: cacheData, timestamp: Date.now() }));

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

  const formatNumber = useCallback(
    (num: number) =>
      new Intl.NumberFormat("en-US", { notation: "compact" }).format(num),
    []
  );

  const getChangeColor = useCallback(
    (change: number) =>
      change > 0
        ? "text-green-400"
        : change < 0
        ? "text-red-400"
        : "text-gray-400",
    []
  );

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

  const saveProfile = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const newName = (
        form.elements.namedItem("name") as HTMLInputElement
      ).value.trim();
      const bio = (form.elements.namedItem("bio") as HTMLTextAreaElement).value;
      const file = (form.elements.namedItem("avatar") as HTMLInputElement)
        .files?.[0];

      if (!newName) return;

      const oldName = userProfile?.name;
      const oldKey = oldName ? getUserKey(oldName) : null;

      const handleSave = (avatar: string) => {
        const newProfile: UserProfile = { name: newName, bio, avatar };
        setUserProfile(newProfile);
        setAvatarPreview(null);
        setShowProfileModal(false);

        const newKey = getUserKey(newName);
        const data: UserData = {
          profile: newProfile,
          portfolios,
          watchlist: globalWatchlist,
        };
        localStorage.setItem(newKey, JSON.stringify(data));

        if (oldKey && oldKey !== newKey) {
          localStorage.removeItem(oldKey);
        }

        localStorage.setItem("cryptoLastUser", newName);
        loadUserData(newName);
      };

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => handleSave(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        handleSave(userProfile?.avatar || "");
      }
    },
    [userProfile, portfolios, globalWatchlist, getUserKey, loadUserData]
  );

  useEffect(() => {
    if (!loading && userProfile) {
      const key = getUserKey(userProfile.name);
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved) as UserData;
        data.portfolios = portfolios;
        data.watchlist = globalWatchlist;
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
  }, [portfolios, globalWatchlist, userProfile, loading, getUserKey]);

  const signOut = useCallback(() => {
    setUserProfile(null);
    setPortfolios([]);
    setGlobalWatchlist([]);
    setSelectedPortfolioId(null);
    setIsProfileOpen(false);
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
    <div className="container mx-auto p-2 md:p-4 max-w-7xl">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Crypset</h1>
        
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-800 p-1 md:p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {userProfile.avatar && (
                  <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-gray-600 flex-shrink-0">
                    <Image
                      src={userProfile.avatar}
                      alt="avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium text-sm md:text-base flex items-center gap-1 md:gap-2">
                    <span className="max-w-[100px] truncate">{userProfile.name}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 hidden sm:block truncate max-w-[150px]">
                    {userProfile.bio || "Crypto Enthusiast"}
                  </p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden animation-fade-in">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={16} className="text-blue-400" /> Edit Profile
                  </button>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700/80 hover:text-red-300 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Delete Profile
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-600 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <User size={16} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* === HERO GREETING SECTION === */}
      {/* Menampilkan waktu dan greeting sesuai waktu lokal */}
      <section className="mb-8 mt-2">
        <div className="flex flex-col justify-center">
          <p className="text-gray-400 text-sm md:text-base font-medium mb-1">
            {currentDate}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            {greeting}
            <span className="text-gray-500">
              {userProfile ? `, ${userProfile.name.split(' ')[0]}` : ''}
            </span>
            <span className="text-blue-500">.</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg max-w-2xl">
            Here is what happening with your portfolio and the market today.
          </p>
        </div>
      </section>

      {/* Global Stats */}
      {global && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
            <h2 className="text-xs text-gray-400 md:text-lg md:text-white font-semibold">Total Market Cap</h2>
            <p className="text-base md:text-2xl font-bold">
              ${formatNumber(global.data.total_market_cap.usd)}
            </p>
            <p
              className={`text-xs md:text-base ${getChangeColor(
                global.data.market_cap_change_percentage_24h_usd
              )}`}
            >
              {global.data.market_cap_change_percentage_24h_usd?.toFixed(2) ??
                "0.00"}
              %
            </p>
          </div>
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
            <h2 className="text-xs text-gray-400 md:text-lg md:text-white font-semibold">24h Volume</h2>
            <p className="text-base md:text-2xl font-bold">
              ${formatNumber(global.data.total_volume.usd)}
            </p>
          </div>
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
            <h2 className="text-xs text-gray-400 md:text-lg md:text-white font-semibold">BTC Dominance</h2>
            <p className="text-base md:text-2xl font-bold">
              {global.data.market_cap_percentage.btc.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg flex flex-col justify-center items-start">
            <h2 className="text-xs text-gray-400 md:text-lg md:text-white font-semibold">Portfolios</h2>
            <button
              onClick={() => setShowNewListModal(true)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 text-sm md:text-base font-medium"
            >
              <Plus size={14} /> New List
            </button>
          </div>
        </section>
      )}

      {/* Portfolio Tabs & Summary */}
      {portfolios.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-nowrap overflow-x-auto gap-3 border-b border-gray-700 pb-1 no-scrollbar">
            {portfolios.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  selectedPortfolioId === p.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                onClick={() => setSelectedPortfolioId(p.id)}
              >
                <span className="truncate max-w-[120px] md:max-w-xs text-sm md:text-base">{p.name}</span>
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
            <div className="bg-gray-800 p-3 md:p-4 rounded-lg mt-4">
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 items-end">
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Total Value</p>
                  <p className="text-lg md:text-2xl font-bold">
                    ${portfolioValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Total Cost</p>
                  <p className="text-base md:text-xl">${portfolioCost.toFixed(2)}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs md:text-sm text-gray-400">PnL</p>
                  <p
                    className={`text-lg md:text-xl font-bold ${
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
                  className="col-span-2 md:col-span-1 md:ml-auto bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2 text-sm md:text-base"
                >
                  <Plus size={18} /> Add Investment
                </button>
              </div>
            </div>
          )}

          {currentPortfolio && currentPortfolio.holdings.length > 0 ? (
            <div className="mt-4 md:mt-6 overflow-x-auto">
              <table className="w-full table-auto whitespace-nowrap">
                <thead className="bg-gray-800 text-xs md:text-sm uppercase text-gray-400">
                  <tr>
                    <th className="p-2 text-left">Asset</th>
                    <th className="p-2 text-right hidden sm:table-cell">Holdings</th>
                    <th className="p-2 text-right hidden md:table-cell">Avg Buy</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Value</th>
                    <th className="p-2 text-right">PnL</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody className="text-sm md:text-base">
                  {currentPortfolio.holdings.map((h) => (
                    <HoldingRow
                      key={h.coinId}
                      h={h}
                      coinsMap={coinsMap}
                      openEditHolding={openEditHolding}
                      removeHolding={removeHolding}
                      onCoinClick={handleCoinClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            currentPortfolio && (
              <div className="text-center py-8 text-gray-400 bg-gray-800/50 rounded-lg mt-4 border border-dashed border-gray-700">
                <p>No holdings yet.</p>
                <p className="text-sm">Tap Add Investment to start tracking.</p>
              </div>
            )
          )}
        </section>
      )}

      {/* === LAZY LOADED SECTIONS === */}
      <Suspense
        fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}
      >
        <WatchlistSection
          coins={coins}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
          formatNumber={formatNumber}
          getChangeColor={getChangeColor}
          onCoinClick={handleCoinClick}
        />
      </Suspense>

      <Suspense
        fallback={<div className="h-64 bg-gray-800 rounded-lg animate-pulse" />}
      >
        <TrendingSection
          trending={trending}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
          onCoinClick={handleCoinClick}
        />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-screen bg-gray-800 rounded-lg animate-pulse" />
        }
      >
        <FullTableSection
          coins={coins}
          globalWatchlist={globalWatchlist}
          toggleGlobalWatchlist={toggleGlobalWatchlist}
          formatNumber={formatNumber}
          getChangeColor={getChangeColor}
          onCoinClick={handleCoinClick}
        />
      </Suspense>

      {/* ==================== MODALS ==================== */}
      {/* ... Code Modal Sama seperti sebelumnya ... */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-5 md:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl md:text-2xl mb-4">
              {userProfile ? "Edit Profile" : "Create Profile"}
            </h2>
            <form onSubmit={saveProfile}>
              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-400">Name</label>
                <input
                  name="name"
                  required
                  className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={userProfile?.name || ""}
                  placeholder="Your name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-400">Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={userProfile?.bio || ""}
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-400">Profile Picture</label>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="w-full mb-3 text-sm text-gray-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () =>
                        setAvatarPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {(avatarPreview || userProfile?.avatar) && (
                  <div className="flex justify-center my-4">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl">
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
                  className="flex-1 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setAvatarPreview(null);
                  }}
                  className="flex-1 bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
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

// === HoldingRow (Tidak berubah) ===
const HoldingRow = React.memo(function HoldingRow({ 
  h, 
  coinsMap, 
  openEditHolding, 
  removeHolding,
  onCoinClick,
}: { 
  h: Holding; 
  coinsMap: Map<string, Coin>; 
  openEditHolding: (h: Holding) => void; 
  removeHolding: (coinId: string) => void; 
  onCoinClick?: (symbol: string) => void;
}) {
  const coin = coinsMap.get(h.coinId);
  const cur = coin?.current_price || 0;
  const value = cur * h.amount;
  const cost = h.buyPrice * h.amount;
  const pnl = value - cost;
  const pnlPct = cost ? (pnl / cost) * 100 : 0;
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800 text-sm">
      <td 
        className="p-2 flex items-center cursor-pointer"
        onClick={() => h.symbol && onCoinClick?.(h.symbol)}
      >
        {h.image && <Image src={h.image} alt={h.name || ""} width={20} height={20} className="mr-2 rounded-full" loading="lazy" />}
        <div className="flex flex-col sm:flex-row sm:gap-1">
          <span className="font-bold">{h.symbol?.toUpperCase()}</span>
          <span className="text-gray-400 hidden sm:inline">{h.name}</span>
        </div>
      </td>
      <td className="p-2 text-right hidden sm:table-cell">{h.amount}</td>
      <td className="p-2 text-right hidden md:table-cell">${h.buyPrice.toFixed(2)}</td>
      <td className="p-2 text-right">${cur.toLocaleString()}</td>
      <td className="p-2 text-right font-medium">${value.toLocaleString()}</td>
      <td className={`p-2 text-right ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
        <div className="flex flex-col items-end">
          <span>${pnl.toFixed(2)}</span>
          <span className="text-xs opacity-80">{pnlPct.toFixed(1)}%</span>
        </div>
      </td>
      <td className="p-2 text-center">
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEditHolding(h)} className="text-blue-400 p-1">
            <Edit2 size={14} />
          </button>
          <button onClick={() => removeHolding(h.coinId)} className="text-red-400 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

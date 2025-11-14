"use client";
import React from "react";
import Image from "next/image";
import { Sparklines, SparklinesLine } from "react-sparklines";

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

interface WatchlistSectionProps {
  coins: Coin[];
  globalWatchlist: string[];
  toggleGlobalWatchlist: (coinId: string) => void;
  formatNumber: (num: number) => string;
  getChangeColor: (change: number) => string;
  onCoinClick?: (symbol: string) => void;
}

export default function WatchlistSection({
  coins,
  globalWatchlist,
  toggleGlobalWatchlist,
  formatNumber,
  getChangeColor,
  onCoinClick,
}: WatchlistSectionProps) {
  const watchlistCoins = coins.filter((c) => globalWatchlist.includes(c.id));

  if (globalWatchlist.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Global Watchlist</h2>
        <p className="text-gray-400">
          Click star on any coin to add to watchlist
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Global Watchlist</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">24h %</th>
              <th className="p-2 text-right">Market Cap</th>
              <th className="p-2 text-center">Chart</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {watchlistCoins.map((coin) => (
              <tr
                key={coin.id}
                className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                onClick={() => onCoinClick?.(coin.symbol)}
              >
                <td className="p-2 flex items-center">
                  <Image
                    src={coin.image}
                    alt={coin.name}
                    width={24}
                    height={24}
                    className="mr-2"
                    loading="lazy"
                  />
                  {coin.name} ({coin.symbol.toUpperCase()})
                </td>
                <td className="p-2 text-right">
                  ${coin.current_price.toFixed(2)}
                </td>
                <td
                  className={`p-2 text-right ${getChangeColor(
                    coin.price_change_percentage_24h_in_currency
                  )}`}
                >
                  {coin.price_change_percentage_24h_in_currency.toFixed(2)}%
                </td>
                <td className="p-2 text-right">
                  ${formatNumber(coin.market_cap)}
                </td>
                <td className="p-2">
                  <Sparklines
                    data={coin.sparkline_in_7d.price.slice(-30)}
                    limit={30}
                    width={120}
                    height={50}
                  >
                    <SparklinesLine
                      color="#8884d8"
                      style={{ fill: "none", strokeWidth: 1.5 }}
                    />
                  </Sparklines>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGlobalWatchlist(coin.id);
                    }}
                    className="text-yellow-400"
                  >
                    ★
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

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

interface FullTableSectionProps {
  coins: Coin[];
  globalWatchlist: string[];
  toggleGlobalWatchlist: (id: string) => void;
  formatNumber: (num: number) => string;
  getChangeColor: (change: number) => string;
}

export default function FullTableSection({
  coins,
  globalWatchlist,
  toggleGlobalWatchlist,
  formatNumber,
  getChangeColor,
}: FullTableSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">All Cryptocurrencies</h2>
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-screen">
          <table className="w-full table-auto">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">24h %</th>
                <th className="p-3 text-right">Market Cap</th>
                <th className="p-3 text-center">Chart</th>
                <th className="p-3 text-center">Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-gray-700 hover:bg-gray-800 transition"
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
                  <td className="p-3 text-right">
                    ${formatNumber(coin.market_cap)}
                  </td>
                  <td className="p-3">
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
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleGlobalWatchlist(coin.id)}
                      className="text-yellow-400 text-2xl hover:scale-110 transition"
                    >
                      {globalWatchlist.includes(coin.id) ? "★" : "☆"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

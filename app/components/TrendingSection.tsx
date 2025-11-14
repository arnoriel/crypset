"use client";
import React from "react";
import Image from "next/image";

interface TrendingItem {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

interface Trending {
  coins: { item: TrendingItem }[];
}

interface TrendingSectionProps {
  trending: Trending | null;
  globalWatchlist: string[];
  toggleGlobalWatchlist: (id: string) => void;
  onCoinClick?: (symbol: string) => void;
}

export default function TrendingSection({ 
  trending, 
  globalWatchlist, 
  toggleGlobalWatchlist,
  onCoinClick,
}: TrendingSectionProps) {
  if (!trending) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Trending</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trending.coins.slice(0, 8).map(({ item }) => (
          <div
            key={item.id}
            className="bg-gray-800 p-4 rounded-lg flex items-center justify-between cursor-pointer"
            onClick={() => onCoinClick?.(item.symbol)}
          >
            <div className="flex items-center">
              <Image
                src={item.thumb}
                alt={item.name}
                width={32}
                height={32}
                className="mr-2"
                loading="lazy"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-400">
                  {item.symbol.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGlobalWatchlist(item.id);
              }}
              className="text-yellow-400"
            >
              {globalWatchlist.includes(item.id) ? "★" : "☆"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

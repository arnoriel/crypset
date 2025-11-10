// components/AddHoldingModal.tsx
"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { X } from "lucide-react";
import Image from "next/image";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
}
interface Holding {
  coinId: string;
  amount: number;
  buyPrice: number;
  name?: string;
  symbol?: string;
  image?: string;
}

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holding: Holding) => void;
  editingHolding?: Holding | null;
  allCoins: Coin[];
}

export default function AddHoldingModal({
  isOpen,
  onClose,
  onSave,
  editingHolding,
  allCoins,
}: AddHoldingModalProps) {
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // RESET SEMUA STATE KETIKA MODAL DIBUKA
  useEffect(() => {
    if (isOpen) {
      // Kalau sedang edit → isi form
      if (editingHolding) {
        const coin = allCoins.find((c) => c.id === editingHolding.coinId);
        if (coin) {
          setSelectedCoin(coin);
          setRawSearchQuery(`${coin.name} (${coin.symbol.toUpperCase()})`);
        }
        setBuyAmount(editingHolding.amount.toString());
        setBuyPrice(editingHolding.buyPrice.toString());
      } else {
        // Kalau tambah baru → RESET SEMUA!
        setSelectedCoin(null);
        setRawSearchQuery("");
        setBuyAmount("");
        setBuyPrice("");
        setDebouncedQuery("");
      }
    }
  }, [isOpen, editingHolding, allCoins]);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(rawSearchQuery);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [rawSearchQuery]);

  const filteredCoins = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return allCoins
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [debouncedQuery, allCoins]);

  const handleSave = () => {
    if (!selectedCoin || !buyAmount || !buyPrice) return;
    onSave({
      coinId: selectedCoin.id,
      amount: parseFloat(buyAmount),
      buyPrice: parseFloat(buyPrice),
      name: selectedCoin.name,
      symbol: selectedCoin.symbol,
      image: selectedCoin.image,
    });
    // Reset form setelah save (biar aman)
    setSelectedCoin(null);
    setRawSearchQuery("");
    setBuyAmount("");
    setBuyPrice("");
    onClose();
  };

  const handleClose = () => {
    // Pastikan reset saat tutup
    setSelectedCoin(null);
    setRawSearchQuery("");
    setBuyAmount("");
    setBuyPrice("");
    setDebouncedQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">{editingHolding ? "Edit" : "Add"} Investment</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Search Asset</label>
          <div className="relative">
            <input
              type="text"
              value={rawSearchQuery}
              onChange={(e) => setRawSearchQuery(e.target.value)}
              placeholder="Bitcoin, BTC..."
              className="w-full bg-gray-700 px-3 py-2 rounded"
              autoFocus
            />
            {debouncedQuery && !selectedCoin && (
              <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 mt-1 max-h-64 overflow-y-auto z-10">
                {filteredCoins.length === 0 ? (
                  <p className="p-3 text-gray-400">No results</p>
                ) : (
                  filteredCoins.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCoin(c);
                        setRawSearchQuery(`${c.name} (${c.symbol.toUpperCase()})`);
                        setDebouncedQuery(""); // sembunyiin dropdown
                      }}
                      className="p-3 hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                    >
                      <Image src={c.image} alt={c.name} width={24} height={24} />
                      <div>
                        <p>{c.name}</p>
                        <p className="text-sm text-gray-400">
                          {c.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {selectedCoin && (
          <>
            <div className="mb-4 flex items-center gap-3 bg-gray-700 p-3 rounded">
              <Image src={selectedCoin.image} alt={selectedCoin.name} width={32} height={32} />
              <div>
                <p>{selectedCoin.name}</p>
                <p className="text-sm text-gray-400">
                  ${selectedCoin.current_price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCoin(null);
                  setRawSearchQuery("");
                }}
                className="ml-auto text-red-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Amount</label>
                <input
                  type="number"
                  step="any"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
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
          </>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={!selectedCoin || !buyAmount || !buyPrice}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingHolding ? "Update" : "Add"}
          </button>
          <button
            onClick={handleClose}
            className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

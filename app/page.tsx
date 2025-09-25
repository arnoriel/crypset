// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import CoinInputModal from './components/CoinInputModal';
import CoinList from './components/CoinList';
import FinanceChart from './components/FinanceChart';
import { CoinData, calculateTotalValue } from './lib/utils';

export default function Home() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedCoins = localStorage.getItem('crypset-coins');
    if (savedCoins) setCoins(JSON.parse(savedCoins));
  }, []);

  useEffect(() => {
    localStorage.setItem('crypset-coins', JSON.stringify(coins));
  }, [coins]);

  const addCoin = (newCoin: CoinData) => {
    setCoins((prev) => [...prev, newCoin]);
  };

  const removeCoin = (id: string) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">Crypset Wallet</h1>
      <p className="text-xl mb-6 text-foreground">Total Asset: ${calculateTotalValue(coins).toFixed(2)}</p>
      <button onClick={() => setIsModalOpen(true)} className="bg-primary text-foreground px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-colors">Tambah Coin</button>
      <CoinInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCoin={addCoin} />
      <CoinList coins={coins} onRemove={removeCoin} />
      <FinanceChart coins={coins} />
    </div>
  );
}
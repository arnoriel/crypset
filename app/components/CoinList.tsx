// components/CoinList.tsx
import React from 'react';
import { CoinData } from '../lib/utils';

interface CoinListProps {
  coins: CoinData[];
  onRemove: (id: string) => void;
}

const CoinList: React.FC<CoinListProps> = ({ coins, onRemove }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-foreground">Daftar Coin</h3>
      <ul className="space-y-4">
        {coins.map((coin) => (
          <li key={coin.id} className="bg-neutral rounded-lg p-4 shadow-card flex justify-between items-center transition-shadow hover:shadow-lg">
            <div>
              <span className="font-bold text-lg text-foreground">{coin.name} ({coin.symbol})</span> - Qty: {coin.quantity} - Harga: ${coin.price.toFixed(2)}
              <span className={coin.percentChange24h > 0 ? 'text-success' : 'text-danger'}>
                {' '}{coin.percentChange24h.toFixed(2)}%
              </span>
            </div>
            <button onClick={() => onRemove(coin.id)} className="text-danger hover:text-danger/80 transition-colors">Hapus</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CoinList;

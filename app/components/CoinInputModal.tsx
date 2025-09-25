// components/CoinInputModal.tsx
import React, { useState } from 'react';
import Modal from 'react-modal';
import { fetchCoinData, CoinData } from '../lib/utils';

interface CoinInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoin: (coin: CoinData) => void;
}

const CoinInputModal: React.FC<CoinInputModalProps> = ({ isOpen, onClose, onAddCoin }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [percentChange, setPercentChange] = useState(0);

  const handleAdd = async () => {
    let coin: CoinData;
    if (isCustom) {
      coin = {
        id: `custom-${Date.now()}`,
        name,
        symbol: name.slice(0, 3).toUpperCase(),
        price,
        percentChange24h: percentChange,
        quantity,
        isCustom: true,
      };
    } else {
      const data = await fetchCoinData(symbol);
      if (!data) return alert('Coin not found');
      coin = { ...data, quantity };
    }
    onAddCoin(coin);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSymbol('');
    setName('');
    setPrice(0);
    setQuantity(0);
    setPercentChange(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-background p-8 rounded-xl shadow-2xl max-w-md mx-auto mt-20 border border-secondary/30 outline-none"
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <h2 className="text-2xl font-bold mb-6 text-foreground">Tambah Coin</h2>
      <div className="flex mb-6 space-x-2">
        <button
          onClick={() => setIsCustom(false)}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${!isCustom ? 'bg-primary text-foreground' : 'bg-neutral text-foreground/80 hover:bg-neutral/80'}`}
        >
          Coin Reguler
        </button>
        <button
          onClick={() => setIsCustom(true)}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${isCustom ? 'bg-primary text-foreground' : 'bg-neutral text-foreground/80 hover:bg-neutral/80'}`}
        >
          Custom Coin
        </button>
      </div>
      {!isCustom ? (
        <>
          <input
            type="text"
            placeholder="Symbol (e.g., bitcoin)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-neutral text-foreground border border-secondary/20 rounded-md p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Nama Custom Coin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-neutral text-foreground border border-secondary/20 rounded-md p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
          <input
            type="number"
            placeholder="Harga Manual"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="bg-neutral text-foreground border border-secondary/20 rounded-md p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
          <input
            type="number"
            placeholder="% Perubahan 24h (naik/turun)"
            value={percentChange}
            onChange={(e) => setPercentChange(Number(e.target.value))}
            className="bg-neutral text-foreground border border-secondary/20 rounded-md p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
        </>
      )}
      <input
        type="number"
        placeholder="Jumlah Quantity"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="bg-neutral text-foreground border border-secondary/20 rounded-md p-3 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />
      <button onClick={handleAdd} className="bg-success text-foreground px-6 py-3 rounded-lg w-full hover:bg-success/90 transition-colors shadow-md">
        Tambah
      </button>
    </Modal>
  );
};

export default CoinInputModal;

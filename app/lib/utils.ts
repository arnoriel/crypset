import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  percentChange24h: number;
  quantity: number;
  isCustom: boolean;
}

export async function fetchCoinData(symbol: string): Promise<CoinData | null> {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: symbol.toLowerCase(),
      },
    });
    const data = response.data[0];
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price: data.current_price,
      percentChange24h: data.price_change_percentage_24h,
      quantity: 0,
      isCustom: false,
    };
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return null;
  }
}

export function calculateTotalValue(coins: CoinData[]): number {
  return coins.reduce((total, coin) => total + coin.price * coin.quantity, 0);
}

export function calculateOverallChange(coins: CoinData[]): number {
  const totalValue = calculateTotalValue(coins);
  if (totalValue === 0) return 0;
  return coins.reduce((sum, coin) => sum + (coin.price * coin.quantity * coin.percentChange24h) / totalValue, 0);
}

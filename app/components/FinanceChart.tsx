// components/FinanceChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CoinData, calculateOverallChange, calculateTotalValue } from '../lib/utils';

interface FinanceChartProps {
  coins: CoinData[];
}

const FinanceChart: React.FC<FinanceChartProps> = ({ coins }) => {
  // Simulasi data history (bisa diganti fetch real history dari API)
  const totalValue = calculateTotalValue(coins);
  const overallChange = calculateOverallChange(coins);
  const data = [
    { time: 'Yesterday', value: totalValue * (1 - overallChange / 100) },
    { time: 'Today', value: totalValue },
  ];

  return (
    <div className="mt-8 bg-neutral rounded-lg p-6 shadow-card">
      <h3 className="text-xl font-semibold mb-4 text-foreground">Perkembangan Keuangan</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#A1A1AA" />
          <YAxis stroke="#A1A1AA" />
          <Tooltip contentStyle={{ backgroundColor: '#3F3F46', border: 'none', borderRadius: '8px', color: '#F4F4F5' }} />
          <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--secondary)', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-center mt-4 text-sm text-foreground">Overall Change: <span className={overallChange > 0 ? 'text-success' : 'text-danger'}>{overallChange.toFixed(2)}%</span></p>
    </div>
  );
};

export default FinanceChart;

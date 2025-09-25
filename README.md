# Crypset: Crypto Asset Counter Dashboard

Crypset is a simple, modern crypto counter asset dashboard built with Next.js. It allows users to track their crypto assets by adding coins (fetched from CoinGecko API) or custom coins with manual inputs. Data is stored in the browser's localStorage for persistence without a backend database. The UI features a wallet-like interface with asset lists, financial charts, and dark/light mode support.

This project demonstrates real-time crypto price fetching, local data management, and responsive design using Tailwind CSS.

## Features

- **Asset Tracking**: Add regular coins (e.g., Bitcoin via CoinGecko API) or custom coins with manual price and percentage change.
- **Real-Time Data**: Fetches current prices and 24h percentage changes from CoinGecko (no API key required).
- **Total Value Calculation**: Computes combined asset value and overall percentage change.
- **Chart Visualization**: Simple line chart showing financial development (simulated history; expandable to real data).
- **Modal Input**: User-friendly modal for adding coins with options for regular or custom.
- **Theme Toggle**: Switch between light and dark modes, with persistence via localStorage and system preference detection.
- **Persistence**: All data saved in localStorage—clears only if browser cache is deleted.
- **Responsive Design**: Modern UI with cards, gradients, shadows, and Tailwind CSS for a crypto wallet feel.

## Prerequisites

- Node.js (v18 or later recommended).
- npm, yarn, pnpm, or bun as package manager.

No external API keys are needed, as CoinGecko's free tier is used.

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd crypset
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

To run on a custom port (e.g., 3001):
```bash
npm run dev -- -p 3001
```

Open [http://localhost:3000](http://localhost:3000) (or your custom port) in your browser to view the app.

The page auto-updates as you edit files. Start by modifying `app/page.tsx` for the main dashboard.

## Usage

1. Click "Tambah Coin" to open the modal.
2. Choose "Coin Reguler" and enter a CoinGecko ID (e.g., "bitcoin"), or "Custom Coin" for manual inputs.
3. Enter quantity and add—the asset appears in the list.
4. View total assets, coin details, and a chart of overall changes.
5. Toggle dark/light mode in the header.
6. Data persists across refreshes via localStorage.

## Project Structure

- `app/page.tsx`: Main dashboard component.
- `app/components/`: UI components like CoinInputModal, CoinList, FinanceChart, ClientWrapper.
- `app/lib/utils.ts`: API fetching and calculation utilities.
- `app/globals.css`: Global styles with Tailwind and custom variables for themes.
- `tailwind.config.ts`: Tailwind configuration.

## Dependencies

- Next.js: Framework.
- Tailwind CSS: Styling.
- react-modal: Modals.
- recharts: Charts.
- axios: API requests.
- @heroicons/react: Icons for theme toggle.

## Build and Deployment

To build for production:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

For deployment, use platforms like Vercel (recommended for Next.js):
- Push to GitHub.
- Connect to Vercel and deploy.
- See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs): Features and API.
- [Tailwind CSS](https://tailwindcss.com/docs): Utility-first CSS.
- [CoinGecko API](https://www.coingecko.com/en/api/documentation): For crypto data.
- [Recharts](https://recharts.org/): Charting library.

Contributions welcome! Fork the repo and submit a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypset",
  description:
    "A modern crypto market dashboard inspired by Google Finance but better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://api.coingecko.com" />
        <link rel="preconnect" href="https://assets.coingecko.com" />
        <link rel="dns-prefetch" href="https://assets.coingecko.com" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

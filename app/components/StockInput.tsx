"use client";

import { useState } from "react";

interface StockInputProps {
  onFetchStock: (symbol: string) => Promise<void>;
  onAnalyze: () => Promise<void>;
  isLoadingStock: boolean;
  isLoadingAnalysis: boolean;
  hasStockData: boolean;
}

export default function StockInput({
  onFetchStock,
  onAnalyze,
  isLoadingStock,
  isLoadingAnalysis,
  hasStockData,
}: StockInputProps) {
  const [symbol, setSymbol] = useState("");

  const handleFetch = () => {
    if (symbol.trim()) {
      onFetchStock(symbol.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFetch();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-3">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入股票代码 (如: AAPL, TSLA)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoadingStock || isLoadingAnalysis}
        />
        <button
          onClick={handleFetch}
          disabled={isLoadingStock || !symbol.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isLoadingStock ? "加载中..." : "获取行情"}
        </button>
        <button
          onClick={onAnalyze}
          disabled={isLoadingAnalysis || !hasStockData}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isLoadingAnalysis ? "分析中..." : "AI 分析"}
        </button>
      </div>
    </div>
  );
}

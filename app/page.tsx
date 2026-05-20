"use client";

import { useState, useCallback } from "react";
import Header from "@/app/components/Header";
import StockInput from "@/app/components/StockInput";
import StockDisplay from "@/app/components/StockDisplay";
import AIAnalysisResult from "@/app/components/AIAnalysisResult";
import HistoryRecords from "@/app/components/HistoryRecords";
import type { StockData, AnalysisResult } from "@/lib/types";

export default function HomePage() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFetchStock = useCallback(async (symbol: string) => {
    setIsLoadingStock(true);
    setStockError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "获取行情失败");
      }
      const data: StockData = await res.json();
      setStockData(data);
    } catch (err) {
      setStockError(err instanceof Error ? err.message : "未知错误");
      setStockData(null);
    } finally {
      setIsLoadingStock(false);
    }
  }, []);

  const handleSelectRecord = useCallback((record: AnalysisResult) => {
    setStockError(null);
    setAnalysisError(null);
    setStockData({
      symbol: record.symbol,
      price: record.price,
      change_percent: record.change_percent,
      open: record.open,
      high: record.high,
      low: record.low,
      volume: record.volume,
      updated_at: record.created_at.split("T")[0],
    });
    setAnalysisResult(record);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!stockData) return;

    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI 分析失败");
      }
      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [stockData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <StockInput
          onFetchStock={handleFetchStock}
          onAnalyze={handleAnalyze}
          isLoadingStock={isLoadingStock}
          isLoadingAnalysis={isLoadingAnalysis}
          hasStockData={stockData !== null}
        />

        <StockDisplay data={stockData} isLoading={isLoadingStock} error={stockError} />

        <AIAnalysisResult analysis={analysisResult} isLoading={isLoadingAnalysis} error={analysisError} />

        <HistoryRecords refreshTrigger={historyRefreshTrigger} onSelectRecord={handleSelectRecord} />
      </main>
    </div>
  );
}

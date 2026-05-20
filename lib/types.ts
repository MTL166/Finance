export interface StockData {
  symbol: string;
  price: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  symbol: string;
  price: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  summary: string;
  sentiment: "Bullish" | "Neutral" | "Bearish";
  risk_level: "Low" | "Medium" | "High";
  created_at: string;
}

export interface HistoryResponse {
  records: AnalysisResult[];
  total: number;
}

export interface DeepSeekAnalysis {
  summary: string;
  sentiment: "Bullish" | "Neutral" | "Bearish";
  risk_level: "Low" | "Medium" | "High";
}

import type { AnalysisResult } from "@/lib/types";

interface AIAnalysisResultProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

const sentimentConfig: Record<string, { color: string; label: string }> = {
  Bullish: { color: "bg-green-100 text-green-800 border-green-300", label: "看涨" },
  Neutral: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "中性" },
  Bearish: { color: "bg-red-100 text-red-800 border-red-300", label: "看跌" },
};

const riskConfig: Record<string, { color: string; label: string }> = {
  Low: { color: "bg-green-100 text-green-800", label: "低风险" },
  Medium: { color: "bg-yellow-100 text-yellow-800", label: "中风险" },
  High: { color: "bg-red-100 text-red-800", label: "高风险" },
};

export default function AIAnalysisResult({ analysis, isLoading, error }: AIAnalysisResultProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  const sent = sentimentConfig[analysis.sentiment] || sentimentConfig.Neutral;
  const risk = riskConfig[analysis.risk_level] || riskConfig.Medium;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI 智能分析</h2>

      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className={`px-3 py-1 rounded-full border text-sm font-medium ${sent.color}`}>
          {sent.label} ({analysis.sentiment})
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${risk.color}`}>
          {risk.label} ({analysis.risk_level})
        </span>
        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
          {analysis.symbol}
        </span>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        分析时间: {new Date(analysis.created_at).toLocaleString("zh-CN")}
      </p>
    </div>
  );
}

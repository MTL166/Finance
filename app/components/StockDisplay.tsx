import type { StockData } from "@/lib/types";

interface StockDisplayProps {
  data: StockData | null;
  isLoading: boolean;
  error: string | null;
}

export default function StockDisplay({ data, isLoading, error }: StockDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
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

  if (!data) return null;

  const changeColor = data.change_percent >= 0 ? "text-green-600" : "text-red-600";
  const arrow = data.change_percent >= 0 ? "▲" : "▼";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{data.symbol}</h2>
        <span className="text-sm text-gray-500">更新: {data.updated_at}</span>
      </div>

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-bold text-gray-900">${data.price.toFixed(2)}</span>
        <span className={`text-xl font-semibold ${changeColor}`}>
          {arrow} {data.change_percent > 0 ? "+" : ""}{data.change_percent.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoItem label="开盘" value={`$${data.open.toFixed(2)}`} />
        <InfoItem label="最高" value={`$${data.high.toFixed(2)}`} />
        <InfoItem label="最低" value={`$${data.low.toFixed(2)}`} />
        <InfoItem label="成交量" value={data.volume.toLocaleString()} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

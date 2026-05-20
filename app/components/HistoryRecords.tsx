"use client";

import { useEffect, useState, useCallback } from "react";
import type { AnalysisResult, HistoryResponse } from "@/lib/types";

interface HistoryRecordsProps {
  refreshTrigger: number;
  onSelectRecord?: (record: AnalysisResult) => void;
}

const sentimentLabels: Record<string, string> = {
  Bullish: "看涨",
  Neutral: "中性",
  Bearish: "看跌",
};

const statusColors: Record<string, string> = {
  Bullish: "text-green-600",
  Neutral: "text-yellow-600",
  Bearish: "text-red-600",
};

export default function HistoryRecords({ refreshTrigger, onSelectRecord }: HistoryRecordsProps) {
  const [records, setRecords] = useState<AnalysisResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history?limit=20");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data: HistoryResponse = await res.json();
      setRecords(data.records);
      setTotal(data.total);
      setSelectedIds(new Set());
      setShowCheckboxes(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectMode = () => {
    if (showCheckboxes) {
      setShowCheckboxes(false);
      setSelectedIds(new Set());
    } else {
      setShowCheckboxes(true);
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(records.map((r) => r.id)));
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0 || deleting) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 条记录？`)) return;

    setDeleting(true);
    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      fetchHistory();
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const deleteAll = async () => {
    if (deleting) return;
    if (!confirm(`确定删除全部 ${total} 条记录？此操作不可撤销。`)) return;

    setDeleting(true);
    try {
      await fetch("/api/history?all=true", { method: "DELETE" });
      fetchHistory();
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">历史分析记录</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">历史分析记录</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">历史分析记录</h2>
        <p className="text-gray-400 text-center py-4">暂无分析记录，请先进行 AI 分析</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">历史分析记录</h2>
          <span className="text-sm text-gray-400">共 {total} 条</span>
        </div>
        <div className="flex items-center gap-2">
          {showCheckboxes && (
            <>
              <button
                onClick={deleteSelected}
                disabled={deleting || selectedIds.size === 0}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "删除中..." : `删除选中 (${selectedIds.size})`}
              </button>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                全部选择
              </button>
            </>
          )}
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              showCheckboxes
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showCheckboxes ? "取消选择" : "选择"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            onClick={() => onSelectRecord?.(record)}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={selectedIds.has(record.id)}
                onChange={() => toggleSelect(record.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-gray-300 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 mr-4">
              <span className="font-bold text-gray-900 mr-2">{record.symbol}</span>
              <span className="text-sm text-gray-500 truncate block">{record.summary}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-medium ${statusColors[record.sentiment] || ""}`}>
                {sentimentLabels[record.sentiment] || record.sentiment}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(record.created_at).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 股票分析面板",
  description: "基于AI的股票分析工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}

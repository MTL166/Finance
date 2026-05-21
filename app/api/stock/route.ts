import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: object; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol || !/^[A-Za-z]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: "无效的股票代码" }, { status: 400 });
  }

  const upper = symbol.toUpperCase();

  const cached = cache.get(upper);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${upper}&apikey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();

  if (data["Error Message"]) {
    return NextResponse.json({ error: "无效的股票代码或 API Key" }, { status: 400 });
  }
  if (data["Note"] || data["Information"]) {
    const msg = data["Note"] || data["Information"] || "";
    console.error("Alpha Vantage rate limit:", msg);
    return NextResponse.json({
      error: "API 请求超过当日限制（免费版每天25次），请在 UTC 0 点后重试或升级付费计划",
    }, { status: 429 });
  }

  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) {
    return NextResponse.json({ error: "暂无该股票的数据" }, { status: 404 });
  }

  const price = parseFloat(quote["05. price"]);
  const changePercent = parseFloat(quote["10. change percent"]?.replace("%", "") || "0");

  const result = {
    symbol: upper,
    price,
    change_percent: parseFloat(changePercent.toFixed(2)),
    open: parseFloat(quote["02. open"]),
    high: parseFloat(quote["03. high"]),
    low: parseFloat(quote["04. low"]),
    volume: parseInt(quote["06. volume"], 10),
    updated_at: quote["07. latest trading day"],
  };

  cache.set(upper, { data: result, timestamp: Date.now() });

  return NextResponse.json(result);
}

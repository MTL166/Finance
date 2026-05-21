import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol || !/^[A-Za-z]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: "无效的股票代码" }, { status: 400 });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol.toUpperCase()}&apikey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();

  if (data["Error Message"]) {
    return NextResponse.json({ error: "无效的股票代码或 API Key" }, { status: 400 });
  }
  if (data["Note"] || data["Information"]) {
    const msg = data["Note"] || data["Information"] || "";
    console.error("Alpha Vantage rate limit:", msg);
    return NextResponse.json({ error: "API 请求频率超限，请等待1分钟后再试" }, { status: 429 });
  }

  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) {
    return NextResponse.json({ error: "暂无该股票的数据" }, { status: 404 });
  }

  const dates = Object.keys(timeSeries).sort().reverse();
  const latestDate = dates[0];
  const latestData = timeSeries[latestDate];

  const close = parseFloat(latestData["4. close"]);
  const prevClose = dates[1] ? parseFloat(timeSeries[dates[1]]["4. close"]) : close;
  const changePercent = ((close - prevClose) / prevClose) * 100;

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    price: close,
    change_percent: parseFloat(changePercent.toFixed(2)),
    open: parseFloat(latestData["1. open"]),
    high: parseFloat(latestData["2. high"]),
    low: parseFloat(latestData["3. low"]),
    volume: parseInt(latestData["5. volume"], 10),
    updated_at: latestDate,
  });
}

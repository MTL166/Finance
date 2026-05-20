import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { DeepSeekAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { symbol, price, change_percent, open, high, low, volume, updated_at } = body;

  if (!symbol || price === undefined) {
    return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  const systemPrompt = `你是一个专业的股票分析师。请根据以下股票数据进行分析。

股票代码：${symbol}
当前价格：${price}
涨跌幅：${change_percent}%
开盘价：${open}
最高价：${high}
最低价：${low}
成交量：${volume}
数据时间：${updated_at}

请严格按照以下JSON格式返回分析结果，不要包含任何其他文字：
{
  "summary": "走势概述，30-80字，中文",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}`;

  const deepseekResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请根据以上股票数据进行分析。" },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!deepseekResponse.ok) {
    console.error("DeepSeek API error:", await deepseekResponse.text().catch(() => ""));
    return NextResponse.json({ error: "AI 分析服务不可用" }, { status: 502 });
  }

  const deepseekData = await deepseekResponse.json();
  const content = deepseekData.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "AI 返回空结果" }, { status: 502 });
  }

  let analysis: DeepSeekAnalysis;
  try {
    // Remove markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    analysis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "AI 返回格式异常" }, { status: 422 });
  }

  const validSentiments = ["Bullish", "Neutral", "Bearish"];
  const validRiskLevels = ["Low", "Medium", "High"];

  if (
    typeof analysis.summary !== "string" ||
    analysis.summary.length < 5 ||
    !validSentiments.includes(analysis.sentiment) ||
    !validRiskLevels.includes(analysis.risk_level)
  ) {
    return NextResponse.json({ error: "AI 返回数据校验失败" }, { status: 422 });
  }

  const { data: inserted, error: dbError } = await supabase
    .from("stock_analyses")
    .insert({
      symbol: symbol.toUpperCase(),
      price,
      change_percent,
      open,
      high,
      low,
      volume,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      risk_level: analysis.risk_level,
    })
    .select("id, symbol, summary, sentiment, risk_level, created_at")
    .single();

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json({ error: "保存分析结果失败" }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}

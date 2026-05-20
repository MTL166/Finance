import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "20"),
    50
  );
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

  const { data: records, error, count } = await supabase
    .from("stock_analyses")
    .select("id, symbol, price, change_percent, open, high, low, volume, summary, sentiment, risk_level, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 });
  }

  return NextResponse.json({
    records: records || [],
    total: count || 0,
  });
}

export async function DELETE(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all");

  // 全部删除
  if (all === "true") {
    const { error } = await supabase
      .from("stock_analyses")
      .delete()
      .gt("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  }

  // 批量选中删除
  const { ids } = await request.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请提供要删除的记录 ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("stock_analyses")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, count: ids.length });
}

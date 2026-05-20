# AI 股票分析面板

在线地址：**[https://finance-lymc.onrender.com](https://finance-lymc.onrender.com)**

基于 Next.js 16 全栈应用——输入股票代码获取实时行情，调用 DeepSeek LLM 进行 AI 智能分析，结果存入 Supabase 并支持历史回溯。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| 后端 | Next.js API Routes |
| 数据库 | Supabase PostgreSQL |
| 行情数据 | Alpha Vantage API |
| AI 分析 | DeepSeek Chat API |

## 功能

- 输入股票代码获取实时行情（价格、涨跌幅、OHLCV）
- 点击 AI 分析，LLM 返回结构化 JSON 分析结果
- 分析结果自动存入 Supabase，支持历史回溯
- 历史记录支持选择删除

## 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 环境变量

创建 `.env.local` 文件：

```env
ALPHA_VANTAGE_API_KEY=你的Alpha_Vantage密钥
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

---

## 核心技巧：强制 LLM 只返回 JSON

 `/api/analyze` 中使用的完整方案：

### 1. System Prompt 设计

```
你是专业股票分析师。根据提供的行情数据（OHLCV），输出 JSON 格式分析结果，不要输出任何其他内容。

分析标准:
- summary: 结合价格趋势、成交量变化、关键技术位，30-80字
- sentiment: 基于均线排列、量价配合、短期动量综合判断
- risk_level: 基于波动率、成交量异常程度、价格位置评估
```

**关键原则**：
- 开头强调角色 → 锚定上下文
- 明确禁止额外输出 → "不要输出任何其他内容"
- 给出具体判断标准 → 模型有据可依，减少幻觉

### 2. 三层 JSON 防护

```typescript
// 第一层：让模型输出结构化 JSON
const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "请根据以上股票数据进行分析。" }
    ],
    temperature: 0.3,   // 低温度 = 更稳定输出
    max_tokens: 500,    // 限制输出长度，避免废话
  }),
});

// 第二层：清洗 Markdown 代码块
let content = response.choices[0].message.content;
const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();

// 第三层：JSON.parse 校验 + Schema 校验
let analysis = JSON.parse(cleaned);
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
```

**三层防护总结**：

| 层级 | 作用 | 失败的后果 |
|------|------|-----------|
| Prompt 约束 | 引导模型只输出 JSON | 可能仍输出 Markdown 或废话 |
| 正则清洗 | 去除 \`\`\`json 等包裹 | 清理后仍可能不是合法 JSON |
| Schema 校验 | 验证结构和值域 | 确认 JSON 合法且字段正确 |

---

## 实战案例：用 AI 工具修复部署失败和 JSON 解析 BUG

### 问题背景

项目部署到 Render 后，日志显示：

```
Error: AI 返回格式异常
```

浏览器点击「AI 分析」按钮返回 422 错误。但本地 `npm run dev` 完全正常。

### 排查过程

#### 1. 定位根因

把问题抛给 Claude Code：

> "Render 部署后 AI 分析返回 422 错误，日志显示 AI 返回格式异常，本地正常。帮我分析原因。"

Claude 迅速指出：**Render 环境变量未设置 `DEEPSEEK_BASE_URL`**。

分析逻辑：
- 代码中 `process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1"`——本地 `.env.local` 有值所以正常
- Render 漏配了这个变量，fallback 到硬编码默认值恰好相同所以没暴露
- 真正的根因是 Render 上的 `DEEPSEEK_API_KEY` 变量名打错了（`DEEPSEEK_API_KEY` 写成 `DEEPSEEK_KEY`）
- DeepSeek 收到无效 API Key → 返回 HTML 错误页而非 JSON → `JSON.parse()` 失败 → 422

#### 2. 修复

在 Render Dashboard → Environment → 修正变量名 → 重新部署 → 问题解决。

### 经验总结

1. **环境变量管理**：部署时务必逐一核对变量名，大小写敏感
2. **错误信息要具体**：代码中 `catch { return "AI 返回格式异常" }` 太笼统，后续改为打印原始返回内容 → `console.error("DeepSeek raw:", content)` ——下次出错直接能在 Render 日志中看到原始响应
3. **让 AI 帮你排查**：把错误日志贴给 Claude/DeepSeek，它能快速定位根因而非表面症状
4. **部署前 Checklist**：环境变量列表 → 逐个在 Render 中确认 → 部署 → 验证 API 是否返回 200

---

## 部署 (Render)

1. 将项目推送到 GitHub
2. Render 中 New + → Web Service → 选择仓库
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. 添加所有环境变量
6. 点击 Deploy

import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface KeywordItem {
  keyword: string
  type: "primary" | "secondary" | "longtail"
  priority: number
  placement: "title" | "bullet" | "backend"
}

interface OpenAIKeywordResponse {
  keywords: KeywordItem[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { productIdea?: string; category?: string }
    const productIdea = (body.productIdea ?? "").trim()
    const category = (body.category ?? "Other").trim()

    if (!productIdea) {
      return NextResponse.json({ error: "Product idea is required." }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an Amazon SEO expert. Generate exactly 24 keywords for the given product.
Return JSON: { "keywords": [ { "keyword": string, "type": "primary"|"secondary"|"longtail", "priority": number (1-10), "placement": "title"|"bullet"|"backend" } ] }

Rules:
- 6 primary keywords (high volume, broad, priority 8-10, placement: title)
- 8 secondary keywords (supporting, mid-volume, priority 5-7, placement: bullet)
- 10 longtail keywords (specific phrases, lower competition, priority 2-4, placement: backend)
- Include common customer phrasing, gift searches, use-case searches
- No brand names`,
        },
        {
          role: "user",
          content: `Product: ${productIdea}\nCategory: ${category}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as OpenAIKeywordResponse

    const keywords: KeywordItem[] = Array.isArray(parsed.keywords) ? parsed.keywords : []

    return NextResponse.json({ keywords })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[keyword-tool] Error:", msg)
    return NextResponse.json({ error: `Keyword generation failed: ${msg.slice(0, 300)}` }, { status: 500 })
  }
}

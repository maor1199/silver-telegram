import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    let accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      const cookieStore = await cookies()
      const supabase = await createClient(cookieStore)
      const { data: { session } } = await supabase.auth.getSession()
      accessToken = session?.access_token?.trim() ?? undefined
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const supabaseAnon = await createClient()
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken)
    if (!user?.id) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 })
    }

    const { productName, brandName, usp, targetAudience, tone, features } = body

    if (!productName?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Amazon A+ Content strategist. You write compelling, conversion-optimized A+ content modules that increase sales by 3-10%. You know Amazon's A+ content guidelines and what converts.`,
        },
        {
          role: "user",
          content: `Product: ${productName}
Brand: ${brandName || "Generic"}
USP (Unique Selling Proposition): ${usp || "Not specified"}
Target Audience: ${targetAudience || "General consumers"}
Tone: ${tone || "Professional and trustworthy"}
Key Features: ${features || "Not specified"}

Generate complete A+ Content modules in JSON:
{
  "brand_story": {
    "headline": "Brand story headline (max 10 words)",
    "body": "2-3 sentences brand story that builds trust and connection"
  },
  "feature_modules": [
    {
      "icon_suggestion": "emoji or icon name that fits",
      "headline": "Feature headline (max 6 words)",
      "body": "1-2 sentences expanding on this feature/benefit"
    },
    { ... },
    { ... },
    { ... }
  ],
  "comparison_chart": {
    "headline": "Why [Product] vs Generic Alternatives",
    "rows": [
      { "feature": "Feature name", "ours": "✓ Our advantage", "theirs": "✗ Generic limitation" },
      { "feature": "...", "ours": "...", "theirs": "..." },
      { "feature": "...", "ours": "...", "theirs": "..." },
      { "feature": "...", "ours": "...", "theirs": "..." },
      { "feature": "...", "ours": "...", "theirs": "..." }
    ]
  },
  "hero_banner": {
    "headline": "Main A+ hero headline (powerful, benefit-driven, max 12 words)",
    "subheadline": "Supporting line that reinforces the USP",
    "cta": "Short call to action text"
  },
  "faq_module": [
    { "question": "Common customer question?", "answer": "Clear, concise answer" },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "image_prompts": {
    "hero_banner_prompt": "DALL-E prompt for the A+ hero banner image",
    "lifestyle_module_prompt": "DALL-E prompt for lifestyle module image"
  }
}

Make it persuasive, specific to this product, and Amazon A+ compliant.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.4,
    })

    const aplus = JSON.parse(completion.choices[0].message.content ?? "{}")

    return NextResponse.json({ ok: true, ...aplus })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

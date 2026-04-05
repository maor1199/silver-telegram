import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"
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

    const { productName, features, targetAudience, category } = body

    if (!productName?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Amazon listing photographer and creative director.
You know exactly which images convert best for Amazon listings based on the product category.
You understand Amazon's image requirements and buyer psychology.`,
        },
        {
          role: "user",
          content: `Product: ${productName}
Category: ${category || "General"}
Features: ${features || "Not specified"}
Target Audience: ${targetAudience || "General consumers"}

Generate a complete image strategy for this Amazon listing in JSON:
{
  "hero_prompt": "Detailed DALL-E prompt for the hero/main image — white background, product centered, professional product photography style, 8K, clean",
  "images": [
    {
      "slot": 1,
      "type": "hero",
      "title": "Main Product Shot",
      "description": "What this image shows",
      "amazon_role": "Why this image matters for conversion",
      "prompt": "Detailed DALL-E prompt for this specific image",
      "overlay_text": null
    },
    {
      "slot": 2,
      "type": "lifestyle",
      "title": "Lifestyle Image",
      "description": "...",
      "amazon_role": "...",
      "prompt": "Detailed DALL-E prompt...",
      "overlay_text": "Short text to overlay if applicable"
    },
    {
      "slot": 3,
      "type": "feature",
      "title": "Key Feature Highlight",
      "description": "...",
      "amazon_role": "...",
      "prompt": "Detailed DALL-E prompt...",
      "overlay_text": "Feature name"
    },
    {
      "slot": 4,
      "type": "infographic",
      "title": "Benefits Infographic",
      "description": "...",
      "amazon_role": "...",
      "prompt": "Detailed DALL-E prompt...",
      "overlay_text": "Key benefit"
    },
    {
      "slot": 5,
      "type": "problem_solution",
      "title": "Problem → Solution",
      "description": "...",
      "amazon_role": "...",
      "prompt": "Detailed DALL-E prompt...",
      "overlay_text": null
    },
    {
      "slot": 6,
      "type": "comparison",
      "title": "Why Choose This",
      "description": "...",
      "amazon_role": "...",
      "prompt": "Detailed DALL-E prompt...",
      "overlay_text": null
    }
  ],
  "strategy_notes": "2-3 sentences on the overall visual strategy for this specific product",
  "priority_order": [1, 2, 3, 4, 5, 6]
}

Make the DALL-E prompts very specific, photorealistic, and Amazon-conversion optimized.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.4,
    })

    const strategy = JSON.parse(completion.choices[0].message.content ?? "{}")

    return NextResponse.json({ ok: true, ...strategy })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

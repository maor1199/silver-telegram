import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface RequestBody {
  productName: string
  productDescription?: string
  brandName?: string
  keywords: string
}

interface BulletPoint {
  header: string
  content: string
}

interface ListingResult {
  title: string
  bulletPoints: BulletPoint[]
  description: string
  seoNote: string
  backendSearchTerms: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    const { productName, productDescription, brandName, keywords } = body

    if (!productName?.trim()) {
      return NextResponse.json({ error: "productName is required" }, { status: 400 })
    }
    if (!keywords?.trim()) {
      return NextResponse.json({ error: "keywords is required" }, { status: 400 })
    }

    const brandLine = brandName?.trim() ? `Brand name: ${brandName.trim()}` : ""
    const descLine  = productDescription?.trim()
      ? `Product features / description: ${productDescription.trim()}`
      : ""

    const prompt = `You are an expert Amazon listing copywriter with 10+ years writing A9-optimized copy that ranks and converts.

Write a complete Amazon listing for the following product:

Product name: ${productName.trim()}
${brandLine}
${descLine}
Target keywords (use naturally throughout): ${keywords.trim()}

Return a JSON object with exactly these fields:
{
  "title": "The full product title — keyword-rich, under 200 chars, front-loaded with primary keyword, capitalize first letter of each word",
  "bulletPoints": [
    { "header": "BENEFIT HEADER IN CAPS", "content": "supporting detail that sells the benefit, not just the feature — 1-2 concise sentences" },
    { "header": "BENEFIT HEADER IN CAPS", "content": "..." },
    { "header": "BENEFIT HEADER IN CAPS", "content": "..." },
    { "header": "BENEFIT HEADER IN CAPS", "content": "..." },
    { "header": "BENEFIT HEADER IN CAPS", "content": "..." }
  ],
  "description": "Persuasive product description in HTML paragraphs (<p> tags only). 150-200 words. Lead with the core value proposition. Second paragraph handles objections. Third paragraph drives action with a call to add to cart.",
  "seoNote": "One sentence explaining the primary A9 optimization strategy used in this listing.",
  "backendSearchTerms": "250 characters of backend search terms — keywords NOT already in the title, separated by spaces, no commas, no brand names"
}

Rules:
- Title: primary keyword first, include top 2-3 keywords naturally, no keyword stuffing
- Bullets: each one addresses a different customer pain point or benefit — no overlap
- Description: storytelling copy, not a spec sheet; use <p> tags
- backendSearchTerms: synonyms, misspellings, related terms not in title/bullets
- Return ONLY valid JSON — no markdown, no code fences, no commentary`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert Amazon listing copywriter. You always return valid JSON with exactly the requested fields. No markdown, no code blocks — raw JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as Partial<ListingResult>

    // Normalize bulletPoints — accept both array-of-strings and array-of-objects
    const bullets: BulletPoint[] = Array.isArray(parsed.bulletPoints)
      ? parsed.bulletPoints.map((b: unknown) => {
          if (typeof b === "object" && b !== null && "header" in b && "content" in b) {
            return b as BulletPoint
          }
          const str = String(b ?? "")
          const match = str.match(/^([A-Z][A-Z\s&/]+)([:\-–]\s?)([\s\S]+)$/)
          if (match) return { header: match[1].trim(), content: match[3].trim() }
          return { header: "", content: str }
        })
      : []

    const result: ListingResult = {
      title:              String(parsed.title ?? ""),
      bulletPoints:       bullets,
      description:        String(parsed.description ?? ""),
      seoNote:            String(parsed.seoNote ?? ""),
      backendSearchTerms: String(parsed.backendSearchTerms ?? ""),
    }

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[generate-listing] Error:", msg)
    return NextResponse.json({ error: `Generation failed: ${msg.slice(0, 200)}` }, { status: 500 })
  }
}

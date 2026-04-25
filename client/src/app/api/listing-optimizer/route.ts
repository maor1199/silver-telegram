import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface RequestBody {
  title: string
  bullets: string[]
  description: string
  keywords: string[]
}

interface Issue {
  severity: "high" | "medium" | "low"
  field: string
  issue: string
  suggestion: string
}

interface OptimizeResult {
  overallScore: number
  scores: {
    title: number
    keywords: number
    clarity: number
    completeness: number
  }
  issues: Issue[]
  rewrites: {
    title: string
    bullets: string[]
    description: string
  }
  missingKeywords: string[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    const { title, bullets, description, keywords } = body

    const userMessage = [
      `Title: ${title}`,
      `Bullets:\n${bullets.join("\n")}`,
      `Description: ${description || "(none provided)"}`,
      `Target keywords: ${keywords.length > 0 ? keywords.join(", ") : "(none provided)"}`,
    ].join("\n\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an Amazon listing optimization expert. Analyze the provided listing and return JSON with exactly this structure:
{
  "overallScore": number,
  "scores": {
    "title": number,
    "keywords": number,
    "clarity": number,
    "completeness": number
  },
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "field": string,
      "issue": string,
      "suggestion": string
    }
  ],
  "rewrites": {
    "title": string,
    "bullets": string[],
    "description": string
  },
  "missingKeywords": string[]
}

All scores are 0-100 integers.
"field" values should be one of: "Title", "Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Description", "Keywords".
"missingKeywords" are keywords from the user's target list not found (case-insensitive) in the title + bullets combined.
"rewrites.description" should be empty string if no description was provided.
"rewrites.bullets" should always contain 5 items.

Scoring criteria:
- Title (0-100): keyword present in first 5 words (+25), 150-200 chars (+25), no ALL CAPS words (+25), includes brand + product type + key feature (+25)
- Keywords (0-100): percentage of provided target keywords appearing in title+bullets (0 keywords provided = 75 baseline)
- Clarity (0-100): no keyword stuffing, reads naturally, benefits-focused language
- Completeness (0-100): all 5 bullets filled (+25), description present (+25), features mentioned (+25), benefits mentioned (+25)
- overallScore: weighted average (title 30%, keywords 25%, clarity 25%, completeness 20%)`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? "{}"
    const result = JSON.parse(raw) as OptimizeResult

    return NextResponse.json(result)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("[listing-optimizer] Error:", err.message)
    return NextResponse.json(
      { error: `Optimization failed: ${err.message.slice(0, 300)}` },
      { status: 500 }
    )
  }
}

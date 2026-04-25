import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface PainPoint {
  theme: string
  severity: "high" | "medium" | "low"
  complaints: string[]
  copyAngle: string
}

interface ReviewAnalysisResult {
  sentiment: { positive: number; neutral: number; negative: number }
  painPoints: PainPoint[]
  positives: string[]
  copyAngles: string[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { reviews?: unknown }
    const reviews = typeof body.reviews === "string" ? body.reviews.trim() : ""

    if (!reviews) {
      return NextResponse.json({ error: "No reviews provided." }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an Amazon product strategist specializing in competitive intelligence from customer reviews.

Analyze the provided reviews and return JSON:
{
  "sentiment": { "positive": number, "neutral": number, "negative": number },
  "painPoints": [
    {
      "theme": string,
      "severity": "high" | "medium" | "low",
      "complaints": string[],
      "copyAngle": string
    }
  ],
  "positives": string[],
  "copyAngles": string[]
}

Rules:
- sentiment percentages must sum to exactly 100
- painPoints: 3-5 themes, each with 2-3 specific complaints and one concrete listing improvement suggestion as copyAngle
- positives: 3-4 things customers love (short phrases)
- copyAngles: exactly 5 specific listing optimization suggestions based on the pain points and positives found`,
        },
        {
          role: "user",
          content: `Reviews:\n${reviews}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as ReviewAnalysisResult

    return NextResponse.json(parsed)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[review-intelligence] Error:", msg)
    return NextResponse.json({ error: `Analysis failed: ${msg.slice(0, 300)}` }, { status: 500 })
  }
}

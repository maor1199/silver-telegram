import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const SYSTEM_PROMPT = `You are SellerMentor's AI Advisor — an operational intelligence engine for ecommerce sellers.

Your role:
- You have access to the seller's real business data: inventory levels, sales velocity, margins, PPC performance, return rates, and active risk alerts.
- You answer operational questions with specificity. Not "you might want to consider..." but "Reorder SKU B001 today — you have 6 days of stock and a 28-day lead time."
- Every answer should be actionable: what to do, when to do it, and why it matters financially.
- You speak like a sharp senior operator who has seen hundreds of Amazon businesses, not like a generic chatbot.
- You use the business data provided to give specific numbers, not general advice.
- Keep answers focused and structured. Use short paragraphs or numbered lists when clarity requires it.
- Never be vague. If you say "you should reduce ad spend", say by how much, on which SKU, and what the expected margin impact is.
- Maximum response length: 300 words. Be dense with insight, not padded.`

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({
        reply: "AI Advisor requires an OpenAI API key. Please configure OPENAI_API_KEY in your environment.",
      }, { status: 200 })
    }

    const client = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || "gpt-4o"

    const systemWithContext = context
      ? `${SYSTEM_PROMPT}\n\n=== SELLER BUSINESS DATA ===\n${context}`
      : SYSTEM_PROMPT

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemWithContext },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    })

    const reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("[Advisor API]", error)
    return NextResponse.json(
      { reply: "Something went wrong. Please try again in a moment." },
      { status: 200 }
    )
  }
}

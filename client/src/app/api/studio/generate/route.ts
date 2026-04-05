import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const CLAID_API_KEY = process.env.CLAID_API_KEY

export async function POST(req: Request) {
  try {
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

    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null
    const prompt = formData.get("prompt") as string
    const imageType = formData.get("type") as string // hero | lifestyle | feature | infographic
    const style = formData.get("style") as string // clean | lifestyle | dark | gradient

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
    }

    // If CLAID key exists and image file provided → use CLAID for background replacement
    // Otherwise → use DALL-E 3 for generation
    if (CLAID_API_KEY && imageFile && imageType === "hero") {
      // CLAID: Background removal + replacement
      const claidFormData = new FormData()
      claidFormData.append("image", imageFile)
      claidFormData.append("output", JSON.stringify({
        format: { type: "jpeg", quality: 95 },
        operations: [
          { operation: "background", parameters: { color: "#FFFFFF" } },
          { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#FFFFFF" } },
        ],
      }))

      const claidRes = await fetch("https://api.claid.ai/v1-beta1/image/edit/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${CLAID_API_KEY}` },
        body: claidFormData,
      })

      if (!claidRes.ok) {
        const err = await claidRes.text()
        return NextResponse.json({ error: `CLAID error: ${err}` }, { status: 500 })
      }

      const claidData = await claidRes.json()
      const imageUrl = claidData?.data?.output?.tmp_url ?? claidData?.output?.url

      return NextResponse.json({ ok: true, url: imageUrl, source: "claid" })
    }

    // DALL-E 3 generation
    const styleModifiers: Record<string, string> = {
      clean: "pure white background, professional product photography, studio lighting, 8K resolution, sharp focus",
      lifestyle: "realistic lifestyle setting, natural lighting, aspirational atmosphere, professional photography",
      dark: "dark moody background, dramatic studio lighting, premium luxury feel, high contrast",
      gradient: "soft gradient background, modern minimalist, clean product shot, professional e-commerce photography",
    }

    const fullPrompt = `${prompt}. Style: ${styleModifiers[style] ?? styleModifiers.clean}. Amazon listing image, conversion-optimized, no text overlays, photorealistic.`

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      size: "1024x1024",
      quality: "hd",
      n: 1,
    })

    const url = response.data[0]?.url
    if (!url) {
      return NextResponse.json({ error: "Image generation failed." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url, source: "dalle3" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const CLAID_API_KEY = process.env.CLAID_API_KEY

// CLAID operations per image type
function buildClaidOperations(imageType: string, style: string) {
  switch (imageType) {
    case "hero":
      // Pure white background, product centered — Amazon main image standard
      return [
        { operation: "background", parameters: { color: "#FFFFFF" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#FFFFFF" } },
      ]

    case "lifestyle":
      // Style-based background treatment
      if (style === "dark") {
        return [
          { operation: "background", parameters: { color: "#1a1a1a" } },
          { operation: "resize", parameters: { width: 2000, height: 2000, fit: "contain", pad_color: "#1a1a1a" } },
        ]
      }
      if (style === "gradient") {
        return [
          { operation: "background", parameters: { color: "#f0f4ff" } },
          { operation: "resize", parameters: { width: 2000, height: 2000, fit: "contain", pad_color: "#f0f4ff" } },
        ]
      }
      // Default lifestyle — soft warm background
      return [
        { operation: "background", parameters: { color: "#faf8f5" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "contain", pad_color: "#faf8f5" } },
      ]

    case "feature":
      // Light accent background to highlight the feature
      return [
        { operation: "background", parameters: { color: "#f5f8ff" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#f5f8ff" } },
      ]

    case "infographic":
      // Clean white for infographic overlays
      return [
        { operation: "background", parameters: { color: "#FFFFFF" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#FFFFFF" } },
      ]

    case "problem_solution":
      // Split-tone: soft grey
      return [
        { operation: "background", parameters: { color: "#f7f7f7" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "contain", pad_color: "#f7f7f7" } },
      ]

    case "comparison":
      // Clean neutral
      return [
        { operation: "background", parameters: { color: "#FFFFFF" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#FFFFFF" } },
      ]

    default:
      return [
        { operation: "background", parameters: { color: "#FFFFFF" } },
        { operation: "resize", parameters: { width: 2000, height: 2000, fit: "pad", pad_color: "#FFFFFF" } },
      ]
  }
}

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

    if (!CLAID_API_KEY) {
      return NextResponse.json({ error: "Image generation is not configured yet." }, { status: 500 })
    }

    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null
    const imageType = (formData.get("type") as string) || "hero"
    const style = (formData.get("style") as string) || "clean"

    if (!imageFile) {
      return NextResponse.json({
        error: "Please upload a product photo to generate images.",
        code: "NO_IMAGE",
      }, { status: 400 })
    }

    const operations = buildClaidOperations(imageType, style)

    const claidFormData = new FormData()
    claidFormData.append("image", imageFile)
    claidFormData.append("output", JSON.stringify({
      format: { type: "jpeg", quality: 95 },
      operations,
    }))

    const claidRes = await fetch("https://api.claid.ai/v1-beta1/image/edit/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${CLAID_API_KEY}` },
      body: claidFormData,
      signal: AbortSignal.timeout(30000),
    })

    if (!claidRes.ok) {
      const errText = await claidRes.text()
      return NextResponse.json({ error: `Image processing failed: ${errText.slice(0, 200)}` }, { status: 500 })
    }

    const claidData = await claidRes.json()
    const imageUrl =
      claidData?.data?.output?.tmp_url ??
      claidData?.data?.output?.url ??
      claidData?.output?.tmp_url ??
      claidData?.output?.url

    if (!imageUrl) {
      return NextResponse.json({ error: "CLAID did not return an image URL. Check the API response." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url: imageUrl, source: "claid", type: imageType })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

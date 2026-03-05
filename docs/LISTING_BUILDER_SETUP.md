# AI Listing Builder – Setup (Image-to-Listing)

The AI Listing Builder uses **mandatory product photo upload**, **Claude** for Amazon Expert copy, and **Replicate (Flux image-to-image)** for photorealistic listing images. Product geometry is preserved; the AI places your product on white background and in lifestyle scenes.

## 1. Environment variables (server)

Add to `server/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For premium copy | Claude 3.5/3.7 for Amazon Expert copy (psychological triggers, SEO). If unset, falls back to OpenAI. |
| `OPENAI_API_KEY` | Yes (fallback) | Used for listing copy when Claude not set, and for image-prompt generation. |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini`. Used for image-prompt generation. |
| `OPENAI_LISTING_MODEL` | No | Used only when Claude is not set. Default: `gpt-4o`. |
| `REPLICATE_API_TOKEN` | For images | Replicate API token. Required for image-to-image (Flux). Get it at [replicate.com](https://replicate.com). |
| `REPLICATE_FLUX_MODEL` | No | Default: `bxclib2/flux_img2img`. Use another Flux img2img model if needed. |
| `SUPABASE_URL` | Yes (for upload) | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes (for upload) | Supabase anon key. |
| `SUPABASE_LISTING_BUCKET` | No | Storage bucket for product uploads. Default: `listing-uploads`. |

## 2. Supabase Storage bucket

Create a **public** storage bucket for product photos:

1. In Supabase Dashboard go to **Storage** and create a bucket named **`listing-uploads`** (or set `SUPABASE_LISTING_BUCKET` to your bucket name).
2. Set the bucket to **Public** so the app can generate public URLs for the image-to-image API.
3. (Optional) Add a policy to allow authenticated uploads only, or keep public uploads for simplicity.

Without this bucket, the "Product photo" upload will fail with a server error.

## 3. Content API (listing copy)

- **Primary:** Anthropic Claude (`ANTHROPIC_API_KEY`). Model: `claude-sonnet-4-20250514` or set `ANTHROPIC_LISTING_MODEL`. Copy is written at "Amazon Expert" level with psychological triggers and SEO-optimized titles.
- **Fallback:** OpenAI when `ANTHROPIC_API_KEY` is not set. Model: `OPENAI_LISTING_MODEL` or `OPENAI_MODEL`.

## 4. Image API (image-to-image)

- **Provider:** Replicate (Flux image-to-image). Model: `REPLICATE_FLUX_MODEL` (default `bxclib2/flux_img2img`).
- **Flow:** User uploads a product photo → server stores it in Supabase Storage → public URL is passed to Replicate with scene prompts. The model keeps the product intact and changes background (white studio or lifestyle).
- **Prompts:** 1 main image (pure white RGB 255,255,255), 3–4 lifestyle scenes. **Negative prompts** are sent to reduce artifacts (distorted text, extra limbs, blurry, etc.).
- **Output:** Image URLs are stored in the report and in My Analyses for later access.

## 5. API endpoints

- **POST `/api/listing-builder/upload`** – **Main flow.** `Content-Type: multipart/form-data`. Required field: `productImage` (file). Fields: `productName`, `description`, `keywords` (comma-separated). Generates copy + images and returns full listing. Optionally auto-saves to reports when user is signed in.
- **POST `/api/listing-builder`** – JSON body, no file. Optional `productImageUrl` if you already have a public URL. Use when not using the upload form.
- **POST `/api/listing-builder/save`** – Save a generated listing to My Analyses. Body: `{ report }`. Requires `Authorization: Bearer <Supabase access token>`.

## 6. Navigation

The **TOOLS** dropdown in the main sidebar includes **AI Listing Builder** and links to `/listing-builder`. Users must upload a product photo before generating.

## 7. Optional: DALL-E 3 fallback

When **no product image** is provided (e.g. JSON-only call to `/api/listing-builder`), the server can fall back to DALL-E 3 for text-to-image if `OPENAI_DALLE_ENABLED` is not `false`. For the main upload flow, image-to-image (Replicate) is used whenever a product photo is supplied.

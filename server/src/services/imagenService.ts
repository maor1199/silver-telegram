/**
 * Imagen 3 (Vertex AI) — Hero (pure white) + Lifestyle (high-end setting).
 * Uses Vertex AI REST predict endpoint when GOOGLE_CLOUD_PROJECT + VERTEX_LOCATION are set.
 *
 * Env: GOOGLE_CLOUD_PROJECT, VERTEX_LOCATION (e.g. us-central1), GOOGLE_APPLICATION_CREDENTIALS (optional).
 */
import { GoogleAuth } from "google-auth-library";
import axios, { AxiosError } from "axios";

const LOG = "[Imagen-Photoshoot]";
const IMAGEN_MODEL = "imagen-3.0-generate-002";

function getVertexConfig(): { project: string; location: string } | null {
  const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
  const location = (process.env.VERTEX_LOCATION ?? process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1").trim();
  if (!project) return null;
  return { project, location };
}

/**
 * Get an access token for Vertex AI (ADC or service account).
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch (err: unknown) {
    console.warn(`${LOG} Auth failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Call Vertex AI Imagen 3 predict endpoint (text-to-image).
 * Returns first image as Buffer (PNG base64 decoded) or null.
 */
export async function generateImageWithImagen(
  prompt: string,
  options?: { aspectRatio?: string }
): Promise<Buffer | null> {
  const config = getVertexConfig();
  if (!config) {
    console.log(`${LOG} Vertex not configured (GOOGLE_CLOUD_PROJECT); skipping Imagen.`);
    return null;
  }
  const token = await getAccessToken();
  if (!token) {
    console.warn(`${LOG} No access token; skipping Imagen.`);
    return null;
  }

  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.project}/locations/${config.location}/publishers/google/models/${IMAGEN_MODEL}:predict`;

  // imagen-3.0-generate-002 does not support negativePrompt; use prompt only.
  const body: Record<string, unknown> = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: options?.aspectRatio ?? "1:1",
    },
  };

  try {
    console.log(`${LOG} Generating image (prompt length: ${prompt.length})...`);
    const res = await axios.post<{ predictions?: Array<{ bytesBase64Encoded?: string }> }>(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 120000,
      validateStatus: () => true,
    });
    if (res.status !== 200) {
      console.error(`${LOG} API error: ${res.status}`, res.data);
      return null;
    }
    const pred = res.data?.predictions?.[0];
    const b64 = pred?.bytesBase64Encoded;
    if (!b64) {
      console.warn(`${LOG} No image in response.`);
      return null;
    }
    const buffer = Buffer.from(b64, "base64");
    console.log(`${LOG} Generated image: ${buffer.length} bytes.`);
    return buffer;
  } catch (err: unknown) {
    const ax = err as AxiosError<{ error?: { message?: string } }>;
    console.error(`${LOG} Request failed:`, ax.response?.data ?? ax.message);
    return null;
  }
}

/**
 * Hero image: product on 100% pure white (#FFFFFF) background, centered, sharp.
 */
export async function generateHeroImage(productDescription: string): Promise<Buffer | null> {
  const prompt = `Professional product photography. ${productDescription}. Product centered on 100% pure white background (#FFFFFF). Sharp focus, high resolution, Amazon main image style. No shadows, no text, no logos.`;
  return generateImageWithImagen(prompt, { aspectRatio: "1:1" });
}

/**
 * Lifestyle image: product in high-end, realistic setting (e.g. modern sunlit living room).
 */
export async function generateLifestyleImage(productDescription: string): Promise<Buffer | null> {
  const prompt = `High-end lifestyle product photography. ${productDescription}. Product perfectly integrated into a modern, sunlit living room. Realistic, premium, natural lighting. Professional interior photography.`;
  return generateImageWithImagen(prompt, { aspectRatio: "1:1" });
}

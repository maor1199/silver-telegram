import FormData from "form-data";
import axios from "axios";

export type ClaidResult = { urls: string[] } | { error: string; code: string };

export const generateWithClaid = async (
  imageUrl: string,
  generatedPrompt: string
): Promise<ClaidResult> => {
  const apiKey = (process.env.PHOMOLY_API_KEY ?? process.env.CLAID_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("[Phomoly/Claid] CLAID_API_KEY is missing");
    return { error: "CLAID_API_KEY is missing", code: "N_CONFIG" };
  }

  console.log("[Phomoly/Claid] Step 3: Sending to Claid with FormData (axios)...");

  // 1. Prepare the image buffer
  const imageBuffer = Buffer.from(imageUrl.split(",")[1] ?? "", "base64");

  // 2. Prepare the operations buffer
  const operations = {
    background: {
      prompt: generatedPrompt,
    },
  };
  const operationsBuffer = Buffer.from(JSON.stringify(operations));

  const form = new FormData();

  // Append image
  form.append("file", imageBuffer, {
    filename: "input.jpg",
    contentType: "image/jpeg",
  });

  // THE CRITICAL FIX: Append operations as a BUFFER with explicit application/json type
  form.append("operations", operationsBuffer, {
    filename: "operations.json",
    contentType: "application/json",
  });

  const response = await axios.post("https://api.claid.ai/v1/image/edit", form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(), // boundary נכון
    },
    validateStatus: () => true,
  });

  const data: any = response.data;
  console.log("[Phomoly/Claid] Claid Response:", JSON.stringify(data, null, 2));

  if (data?.error_code) {
    return {
      error: `Claid API Error: ${data.error_message ?? data.error_code}`,
      code: String(data.error_code),
    };
  }

  const urls: string[] = Array.isArray(data?.urls)
    ? data.urls
    : data?.url
      ? [data.url]
      : [];

  if (!urls.length) {
    return { error: "Claid did not return any image URLs.", code: "NO_GENERATED_IMAGE" };
  }

  return { urls };
};


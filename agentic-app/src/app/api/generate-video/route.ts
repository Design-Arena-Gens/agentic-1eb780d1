import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const GOOGLE_GENAI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const MAX_REFERENCE_IMAGES = 2;

type ReferenceImagePayload = {
  image: {
    bytesBase64Encoded: string;
    mimeType?: string;
  };
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function toReferenceImagePayload(file: File): Promise<ReferenceImagePayload> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    image: {
      bytesBase64Encoded: buffer.toString("base64"),
      mimeType: file.type || undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return jsonError("Missing GOOGLE_GENAI_API_KEY environment variable.", 500);
  }

  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const model = formData.get("model")?.toString() || "veo-3.1-generate-preview";

  if (typeof prompt !== "string" || !prompt.trim()) {
    return jsonError("Prompt is required.");
  }

  const referenceImageEntries = formData.getAll("reference_images").filter(
    (item): item is File => item instanceof File && item.size > 0,
  );

  if (referenceImageEntries.length > MAX_REFERENCE_IMAGES) {
    return jsonError(
      `A maximum of ${MAX_REFERENCE_IMAGES} reference images is supported.`,
    );
  }

  let referenceImages: ReferenceImagePayload[] = [];

  if (referenceImageEntries.length > 0) {
    referenceImages = await Promise.all(
      referenceImageEntries.map((file) => toReferenceImagePayload(file)),
    );
  }

  const payload = {
    prompt,
    config:
      referenceImages.length > 0
        ? {
            referenceImages,
          }
        : undefined,
  };

  try {
    const response = await fetch(
      `${GOOGLE_GENAI_BASE_URL}/models/${model}:generateVideo?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Veo API request failed.";
      return jsonError(message, response.status);
    }

    return NextResponse.json({
      model,
      prompt,
      referenceImageCount: referenceImages.length,
      response: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Request failed unexpectedly.";

    return jsonError(message, 500);
  }
}

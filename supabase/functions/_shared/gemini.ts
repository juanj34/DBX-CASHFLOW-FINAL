/**
 * Native Gemini API helper — uses structured output (responseSchema)
 * instead of the OpenAI-compatible endpoint.
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiRequest {
  systemInstruction: string;
  contents: GeminiContent[];
  responseSchema: Record<string, unknown>;
  temperature?: number;
}

export interface GeminiResponse<T> {
  success: true;
  data: T;
}

export interface GeminiError {
  success: false;
  error: string;
  retryable: boolean;
}

/**
 * Call the native Gemini API with structured JSON output.
 * Returns parsed JSON matching the provided responseSchema.
 */
export async function callGemini<T>(
  req: GeminiRequest,
  model = "gemini-2.5-flash"
): Promise<GeminiResponse<T> | GeminiError> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY is not configured", retryable: false };
  }

  const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    system_instruction: {
      parts: [{ text: req.systemInstruction }],
    },
    contents: req.contents,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: req.responseSchema,
      temperature: req.temperature ?? 0.1,
      // Disable thinking to avoid 10-30s overhead — not needed for structured extraction
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (${response.status}):`, errorText);

    let errorDetail = "";
    try {
      const parsed = JSON.parse(errorText);
      errorDetail = parsed?.error?.message || errorText.slice(0, 300);
    } catch {
      errorDetail = errorText.slice(0, 300);
    }

    if (response.status === 429) {
      return { success: false, error: "Rate limit exceeded. Please try again in a moment.", retryable: true };
    }

    return { success: false, error: `Gemini API error (${response.status}): ${errorDetail}`, retryable: false };
  }

  const result = await response.json();

  // Check for API-level error
  if (result.error) {
    return { success: false, error: result.error.message || "Gemini returned an error", retryable: false };
  }

  // Extract text from response — skip any "thinking" parts, find the text part
  const parts = result.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((p: Record<string, unknown>) => typeof p.text === "string");
  const text = textPart?.text;
  if (!text) {
    console.error("Unexpected Gemini response:", JSON.stringify(result).slice(0, 500));
    return { success: false, error: "No content in Gemini response", retryable: false };
  }

  try {
    const parsed = JSON.parse(text) as T;
    return { success: true, data: parsed };
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text.slice(0, 500));
    return { success: false, error: "Failed to parse structured response from AI", retryable: false };
  }
}


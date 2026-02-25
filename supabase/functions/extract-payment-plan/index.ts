import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5?target=deno";
import { corsPreflightResponse, jsonResponse } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";
import type { GeminiPart, GeminiContent } from "../_shared/gemini.ts";
import { uploadResponseSchema, uploadSystemPrompt } from "../_shared/payment-schema.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const { images, bookingDate } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return jsonResponse({ success: false, error: "No files provided. Please upload at least one image or PDF." });
    }

    console.log(`Processing ${images.length} file(s) for payment plan extraction`);

    // Separate Excel files (text) from images/PDFs (inline_data)
    const parts: GeminiPart[] = [];
    let excelText = "";

    for (let i = 0; i < images.length; i++) {
      const fileData = images[i];
      if (!fileData || typeof fileData !== "string") continue;

      // Excel files — parse to CSV text
      if (
        fileData.startsWith("data:application/vnd.") &&
        (fileData.includes("spreadsheet") || fileData.includes("excel") || fileData.includes("ms-excel"))
      ) {
        try {
          const base64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            const binaryString = atob(base64Match[1]);
            const binaryData = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              binaryData[j] = binaryString.charCodeAt(j);
            }
            const workbook = XLSX.read(binaryData, { type: "array" });
            for (const sheetName of workbook.SheetNames) {
              const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
              excelText += `\n=== Sheet: ${sheetName} ===\n${csv}\n`;
            }
            console.log(`Excel parsed: ${workbook.SheetNames.length} sheet(s)`);
          }
        } catch (e) {
          console.error("Excel parsing error:", e);
          return jsonResponse({ success: false, error: "Failed to parse Excel file." });
        }
        continue;
      }

      // Images/PDFs — send as inline_data
      if (fileData.startsWith("data:")) {
        const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          parts.push({ inline_data: { mime_type: matches[1], data: matches[2] } });
        }
      }
    }

    if (parts.length === 0 && !excelText) {
      return jsonResponse({ success: false, error: "No valid content to analyze." });
    }

    // Build instruction text
    const bookingCtx = bookingDate?.month && bookingDate?.year
      ? `Booking date: ${bookingDate.month}/${bookingDate.year}`
      : "Booking date: Not specified — use document date or assume current month";

    let instruction = `Analyze the following payment plan document and extract all payment information.\n\n`;
    if (images.length > 1) {
      instruction += `MULTI-PAGE DOCUMENT: These pages are from the SAME document. Combine ALL rows from ALL pages.\n\n`;
    }
    instruction += `Context:\n- ${bookingCtx}\n- This is a Dubai real estate payment plan\n`;

    if (excelText) {
      instruction += `\n=== EXCEL DATA ===\n${excelText}\n=== END EXCEL DATA ===\n`;
    }

    // Text instruction first, then images
    const contentParts: GeminiPart[] = [{ text: instruction }, ...parts];

    const contents: GeminiContent[] = [{ role: "user", parts: contentParts }];

    console.log("Calling native Gemini API with structured output...");
    const result = await callGemini<Record<string, unknown>>({
      systemInstruction: uploadSystemPrompt,
      contents,
      responseSchema: uploadResponseSchema,
      temperature: 0.1,
    });

    if (!result.success) {
      console.error("Gemini extraction failed:", result.error);
      return jsonResponse({ success: false, error: result.error });
    }

    const data = result.data as any;

    // Post-processing: strip any milestones that leaked with isHandover
    // (safety net — the schema no longer includes isHandover but older cached responses might)
    if (data.milestones) {
      data.milestones = data.milestones.filter((m: any) => !m.isHandover);
    }

    // Validate: downpayment + milestones + onHandoverPercent = 100%
    const milestoneTotal = (data.milestones || []).reduce(
      (s: number, m: any) => s + (m.paymentPercent || 0),
      0
    );
    const total =
      (data.downpaymentPercent || 0) +
      (data.onHandoverPercent || 0) +
      milestoneTotal;

    if (Math.abs(total - 100) > 1) {
      data.warnings = data.warnings || [];
      data.warnings.push(
        `Percentages sum to ${total.toFixed(1)}%, not 100%. Manual adjustment may be needed.`
      );
      if (data.confidence > 70) data.confidence = 70;
    }

    // Ensure required fields have defaults
    data.hasPostHandover = data.hasPostHandover ?? false;
    data.milestones = data.milestones || [];
    data.warnings = data.warnings || [];
    data.confidence = data.confidence || 80;

    console.log("Extraction successful:", {
      milestones: data.milestones.length,
      total: total.toFixed(1),
      confidence: data.confidence,
      hasPostHandover: data.hasPostHandover,
    });

    return jsonResponse({ success: true, data });
  } catch (error) {
    console.error("Payment plan extraction error:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

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

    // ── POST-PROCESSING: fix completion payments hiding in milestones ──
    // Gemini often puts "Payment On Completion" as a regular milestone or
    // construction milestone because the document lists it alongside installments.
    // It may also misclassify small construction-triggered installments as
    // post-handover because it confuses "70% construction" with "completion".
    data.milestones = data.milestones || [];
    data.warnings = data.warnings || [];

    // Strip any milestones with explicit isHandover flag
    data.milestones = data.milestones.filter((m: any) => !m.isHandover);

    if (data.milestones.length > 0) {
      // ── Strategy 1: Label-based detection ───────────────────────
      let completionIdx = data.milestones.findIndex((m: any) => {
        const label = (m.label || "").toLowerCase();
        const hasCompletionWord =
          label.includes("on completion") ||
          label.includes("upon completion") ||
          label.includes("payment on completion") ||
          label.includes("balance on handover") ||
          label.includes("remaining balance") ||
          label.includes("final payment");
        return hasCompletionWord && m.paymentPercent >= 20;
      });

      // ── Strategy 2: Statistical outlier detection ───────────────
      // In standard plans, installments are small (1-10% each).
      // The completion is the big remaining balance (30-80%).
      // A 70% among [2.5, 2.5, 2.5, 2.5] is an obvious outlier.
      if (completionIdx === -1) {
        const allPercents = data.milestones
          .map((m: any, i: number) => ({ pct: m.paymentPercent || 0, idx: i }));
        if (allPercents.length >= 2) {
          const sorted = [...allPercents].sort((a, b) => b.pct - a.pct);
          const largest = sorted[0];
          const rest = sorted.slice(1);
          const medianPct = rest[Math.floor(rest.length / 2)].pct;
          // Outlier: >= 30% AND at least 3x the median of the rest
          if (largest.pct >= 30 && medianPct > 0 && largest.pct >= medianPct * 3) {
            completionIdx = largest.idx;
          }
        }
      }

      // ── Strategy 3: Construction milestone at >= 95% ────────────
      if (completionIdx === -1) {
        completionIdx = data.milestones.findIndex(
          (m: any) => m.type === "construction" && m.triggerValue >= 95
        );
      }

      // ── Move completion to onHandoverPercent ────────────────────
      if (completionIdx !== -1) {
        const cm = data.milestones[completionIdx];
        // Set (not add) to avoid double-counting if Gemini already set it
        if (!data.onHandoverPercent || data.onHandoverPercent < 5) {
          data.onHandoverPercent = cm.paymentPercent;
        }
        data.milestones.splice(completionIdx, 1);
        data.warnings.push(
          `Moved "${cm.label || "completion"}" (${cm.paymentPercent}%) from installments to completion payment.`
        );
        console.log(
          `Post-processing: moved ${cm.paymentPercent}% completion from milestones to onHandoverPercent`
        );
      }

      // ── Fix misclassified post-handover milestones ──────────────
      // If we have a completion payment AND there are "post-handover"
      // milestones that are small (similar to the other installments),
      // they're probably pre-handover installments that got misclassified
      // because Gemini confused "completion" with "handover".
      const postHO = data.milestones.filter((m: any) => m.type === "post-handover");
      const preHO = data.milestones.filter((m: any) => m.type !== "post-handover");

      if (postHO.length > 0 && (data.onHandoverPercent || 0) >= 20) {
        const maxPostPct = Math.max(...postHO.map((m: any) => m.paymentPercent || 0));
        // If all "post-handover" milestones are small (≤ 10%), they're
        // likely misclassified construction or time installments
        if (maxPostPct <= 10) {
          data.milestones = data.milestones.map((m: any) => {
            if (m.type === "post-handover") {
              // Convert back: keep the label, change type to construction
              return { ...m, type: "construction" };
            }
            return m;
          });
          data.hasPostHandover = false;
          data.postHandoverPercent = 0;
          data.warnings.push(
            `Reclassified ${postHO.length} small "post-handover" milestone(s) as pre-handover construction installments.`
          );
          console.log(
            `Post-processing: reclassified ${postHO.length} post-handover milestones as pre-handover`
          );
        }
      }
    }

    // ── Validate: downpayment + milestones + onHandoverPercent = 100% ──
    const milestoneTotal = (data.milestones || []).reduce(
      (s: number, m: any) => s + (m.paymentPercent || 0),
      0
    );
    const total =
      (data.downpaymentPercent || 0) +
      (data.onHandoverPercent || 0) +
      milestoneTotal;

    if (Math.abs(total - 100) > 1) {
      data.warnings.push(
        `Percentages sum to ${total.toFixed(1)}%, not 100%. Manual adjustment may be needed.`
      );
      if (data.confidence > 70) data.confidence = 70;
    }

    // Ensure required fields have defaults
    data.hasPostHandover = data.hasPostHandover ?? false;
    data.confidence = data.confidence || 80;

    console.log("Extraction successful:", {
      milestones: data.milestones.length,
      onHandoverPercent: data.onHandoverPercent,
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

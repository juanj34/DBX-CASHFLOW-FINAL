

# Fix AI Extractor Errors & Add Excel Import Support

## Issues Identified

### Issue 1: PNG Causing AI Gateway 500 Error
The logs show:
```
AI Response received: {"error":{"message":"Internal Server Error","code":500}}
Payment plan extraction error: Error: AI did not return structured extraction data
```

**Root Cause**: The AI Gateway returned an internal server error (500), which could be due to:
1. Image too large (even after base64 encoding)
2. Temporary gateway issue
3. Model struggling with the image format

**Current Problem**: The edge function treats this as a successful response and tries to parse the error object as tool call data, failing silently.

### Issue 2: No Excel Support
Currently `FileUploadZone.tsx` only accepts:
```typescript
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
```

Excel files (`.xls`, `.xlsx`) are rejected before upload.

---

## Solution

### Part 1: Better Error Handling for AI Gateway Failures

**File: `supabase/functions/extract-payment-plan/index.ts`**

After receiving the AI response, add a check for error responses before processing:

```typescript
const aiResponse = await response.json();
console.log("AI Response received:", JSON.stringify(aiResponse).slice(0, 500));

// NEW: Check if the AI gateway returned an error object
if (aiResponse.error) {
  console.error("AI Gateway returned error:", aiResponse.error);
  throw new Error(
    aiResponse.error.message === "Internal Server Error"
      ? "The AI service encountered an issue processing your image. Please try with a smaller or different image."
      : aiResponse.error.message || "AI processing failed"
  );
}

// Continue with existing tool call extraction...
```

Also add image size validation and optimization:
- Resize large images before sending (max 1500px width/height)
- Convert PNG to JPEG for smaller payload
- Add explicit error messages for image processing failures

### Part 2: Add Excel Import Support

#### Step 2a: Update Frontend to Accept Excel Files

**File: `src/components/dashboard/FileUploadZone.tsx`**

```typescript
const ACCEPTED_TYPES = [
  "image/jpeg", 
  "image/png", 
  "image/webp", 
  "application/pdf",
  "application/vnd.ms-excel",                                    // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"  // .xlsx
];
```

Update the `FileWithPreview` type:
```typescript
export interface FileWithPreview {
  file: File;
  preview: string;
  type: "image" | "pdf" | "excel";
}
```

Update `processFiles`:
```typescript
const isImage = file.type.startsWith("image/");
const isPdf = file.type === "application/pdf";
const isExcel = file.type.includes("spreadsheet") || file.type.includes("excel");

// For Excel, we send to a different parsing flow
if (isExcel) {
  newFiles.push({
    file,
    preview,
    type: "excel",
  });
}
```

#### Step 2b: Create Excel Parser in Edge Function

**File: `supabase/functions/extract-payment-plan/index.ts`**

Add SheetJS for parsing Excel:
```typescript
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
```

Add Excel processing before AI call:
```typescript
// Process Excel files - convert to structured text for AI analysis
const processedContent: any[] = [];
let excelTextContext = "";

for (const item of images) {
  // Check if it's an Excel file (base64 starts with specific headers)
  if (item.startsWith("data:application/vnd.") && 
      (item.includes("spreadsheet") || item.includes("excel"))) {
    
    // Extract base64 data
    const base64Data = item.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Parse with SheetJS
    const workbook = XLSX.read(binaryData, { type: "array" });
    
    // Convert all sheets to text
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      excelTextContext += `\n=== Sheet: ${sheetName} ===\n${csv}\n`;
    }
  } else {
    // Image or PDF - pass to vision model
    processedContent.push(item);
  }
}

// If we have Excel data, add it as text context to the prompt
if (excelTextContext) {
  contentParts.push({
    type: "text",
    text: `\n\nEXCEL PAYMENT SCHEDULE DATA:\n${excelTextContext}`
  });
}
```

#### Step 2c: Update UI for Excel Files

**File: `src/components/dashboard/FileUploadZone.tsx`**

Add Excel icon and display:
```typescript
import { Upload, X, FileText, Loader2, FileSpreadsheet } from "lucide-react";

// In the file preview section:
{f.type === "excel" ? (
  <FileSpreadsheet className="h-8 w-8 text-green-600" />
) : f.type === "pdf" ? (
  <FileText className="h-8 w-8 text-red-500" />
) : (
  <img ... />
)}
```

Update help text:
```typescript
<p className="text-xs text-muted-foreground">
  PDF, Images, Excel (máx 25MB) • Ctrl+V para pegar
</p>
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/extract-payment-plan/index.ts` | Add error response detection, add SheetJS Excel parsing |
| `src/components/dashboard/FileUploadZone.tsx` | Accept Excel MIME types, add "excel" file type, show spreadsheet icon |

---

## Technical Notes

### Excel Flow
```
User uploads .xlsx
    ↓
Frontend creates base64 FileWithPreview (type: "excel")
    ↓
Edge function receives base64
    ↓
SheetJS parses to CSV/JSON
    ↓
CSV text added to AI prompt as context
    ↓
AI extracts payment plan from structured data
```

### Error Handling Improvement
```
Before: AI Gateway 500 → Parse as success → Fail on missing tool_calls
After:  AI Gateway 500 → Detect error object → Throw user-friendly message
```


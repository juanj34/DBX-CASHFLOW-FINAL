import { useState, useCallback, useEffect, useRef } from "react";
import { Sparkles, Loader2, FileText, X, Upload, Clipboard, Wand2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { shouldCompress, compressPdf } from "@/lib/pdfCompressor";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

interface FileReady {
  name: string;
  dataUrl: string;
}

interface PaymentPlanDropZoneProps {
  onExtract: (dataUrls: string[]) => void;
  extracting: boolean;
  disabled?: boolean;
  className?: string;
}

export const PaymentPlanDropZone = ({
  onExtract,
  extracting,
  disabled,
  className,
}: PaymentPlanDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<FileReady | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── File processing ──────────────────────────────────────────────
  const processFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Unsupported file type. Use PNG, JPG, or PDF.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File too large (max 25 MB).");
      return;
    }

    let fileToRead = f;

    // Compress large PDFs
    if (f.type === "application/pdf" && shouldCompress(f)) {
      try {
        const compressed = await compressPdf(f);
        fileToRead = compressed;
      } catch {
        // Continue with original
      }
    }

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileToRead);
    });

    setFile({ name: f.name, dataUrl });
  }, []);

  // ── Drag & Drop ──────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !extracting) setIsDragging(true);
    },
    [disabled, extracting]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled || extracting) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) processFile(droppedFile);
    },
    [disabled, extracting, processFile]
  );

  // ── Click to browse ──────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (disabled || extracting || file) return;
    fileInputRef.current?.click();
  }, [disabled, extracting, file]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  // ── Ctrl+V paste ─────────────────────────────────────────────────
  useEffect(() => {
    if (disabled || extracting) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            processFile(blob);
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [disabled, extracting, processFile]);

  // ── Extract ──────────────────────────────────────────────────────
  const handleExtract = useCallback(() => {
    if (!file) return;
    onExtract([file.dataUrl]);
  }, [file, onExtract]);

  const handleClear = useCallback(() => {
    setFile(null);
  }, []);

  // ── Render: Extracting ────────────────────────────────────────────
  if (extracting) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-theme-accent/30 bg-gradient-to-r from-theme-accent/10 via-theme-accent/5 to-theme-accent/10 p-4",
          className
        )}
      >
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-accent/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/20 border border-theme-accent/30 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-theme-accent animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-accent">
              Extracting payment plan...
            </p>
            <p className="text-xs text-theme-text-muted mt-0.5">
              AI is analyzing your document
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: File ready ────────────────────────────────────────────
  if (file) {
    return (
      <div
        className={cn(
          "rounded-xl border border-theme-accent/30 bg-gradient-to-r from-theme-accent/8 to-theme-accent/4 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/20 border border-theme-accent/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-theme-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-theme-text truncate">
              {file.name}
            </p>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Ready to extract
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleExtract}
            className="bg-gradient-to-r from-theme-accent to-theme-accent/80 hover:from-theme-accent/90 hover:to-theme-accent/70 text-white gap-2 h-9 px-5 font-semibold shadow-lg shadow-theme-accent/20 shrink-0"
          >
            <Wand2 className="w-4 h-4" />
            Extract with AI
          </Button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-theme-border/50 text-theme-text-muted hover:text-theme-text transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Idle (drop zone) ──────────────────────────────────────
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileInput}
      />
      <div
        ref={dropRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200",
          isDragging
            ? "border-theme-accent bg-theme-accent/10 scale-[1.01] shadow-lg shadow-theme-accent/10"
            : "border-theme-border hover:border-theme-accent/50 hover:bg-theme-accent/5 bg-theme-card/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
            isDragging
              ? "bg-theme-accent/20 border border-theme-accent/40"
              : "bg-gradient-to-br from-theme-accent/15 to-theme-accent/5 border border-theme-accent/20 group-hover:from-theme-accent/20 group-hover:to-theme-accent/10"
          )}>
            <Sparkles className={cn(
              "w-5 h-5 transition-colors",
              isDragging ? "text-theme-accent" : "text-theme-accent/70 group-hover:text-theme-accent"
            )} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-theme-text">
              AI Payment Plan Import
            </p>
            <p className="text-xs text-theme-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <FileUp className="w-3 h-3" />
                Drop file
              </span>
              <span className="text-theme-border">|</span>
              <span>Click to browse</span>
              <span className="text-theme-border">|</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-theme-bg rounded border border-theme-border text-[10px] font-mono">
                  Ctrl+V
                </kbd>
                paste
              </span>
            </p>
          </div>

          {/* Format badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {["PDF", "PNG", "JPG"].map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-1 rounded-md bg-theme-bg border border-theme-border text-[10px] font-medium text-theme-text-muted uppercase tracking-wider"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

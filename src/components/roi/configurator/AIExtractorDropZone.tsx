import { useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileWithPreview } from "@/components/dashboard/FileUploadZone";

interface AIExtractorDropZoneProps {
  onFilesDropped: (files: FileWithPreview[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = [
  "image/jpeg", 
  "image/png", 
  "image/webp", 
  "application/pdf",
];

export const AIExtractorDropZone = ({ onFilesDropped, disabled }: AIExtractorDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: FileWithPreview[] = [];
    
    for (const file of Array.from(fileList)) {
      // Check file types
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      
      if (!isImage && !isPdf) {
        console.warn(`Unsupported file type: ${file.type}`);
        continue;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.name}`);
        continue;
      }

      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        file,
        preview,
        type: isPdf ? "pdf" : "image",
      });
    }

    setIsProcessing(false);
    
    if (newFiles.length > 0) {
      onFilesDropped(newFiles);
    }
  }, [onFilesDropped]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      // Click opens extractor empty
      onFilesDropped([]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={cn(
        "border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer",
        isDragging 
          ? "border-purple-400 bg-purple-500/10" 
          : "border-theme-border/40 hover:border-purple-400/50 hover:bg-purple-500/5",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-theme-text-muted">Processing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-theme-text-muted">
              Drop payment plan here or{" "}
              <span className="text-purple-400">click to import</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

import { useCallback, useState, useEffect, useRef } from "react";
import { Upload, X, FileText, Loader2, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressPdf, shouldCompress, formatFileSize } from "@/lib/pdfCompressor";

interface FileUploadZoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  files: FileWithPreview[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  acceptPaste?: boolean;
}

export interface FileWithPreview {
  file: File;
  preview: string;
  type: "image" | "pdf" | "excel";
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = [
  "image/jpeg", 
  "image/png", 
  "image/webp", 
  "application/pdf",
  "application/vnd.ms-excel",                                      // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"  // .xlsx
];

const FileUploadZone = ({ onFilesSelected, files, onRemoveFile, disabled, acceptPaste = true }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    for (let file of Array.from(fileList)) {
      // Check file types
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isExcel = file.type.includes("spreadsheet") || 
                      file.type.includes("excel") || 
                      file.type === "application/vnd.ms-excel";
      
      if (!isImage && !isPdf && !isExcel) {
        console.warn(`Tipo de archivo no soportado: ${file.type}`);
        continue;
      }
      
      // Compress large PDFs
      if (shouldCompress(file)) {
        setIsCompressing(true);
        try {
          const result = await compressPdf(file, (stage, percent) => {
            setCompressionProgress(`${stage} (${percent}%)`);
          });
          
          console.log(`PDF comprimido: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`);
          
          // Create new file from compressed blob
          file = new File([result.compressedBlob], file.name, { type: 'application/pdf' });
        } catch (error) {
          console.error('Error comprimiendo PDF:', error);
        } finally {
          setIsCompressing(false);
          setCompressionProgress("");
        }
      }
      
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`Archivo muy grande después de compresión: ${file.name} (${formatFileSize(file.size)})`);
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
        type: isExcel ? "excel" : isPdf ? "pdf" : "image",
      });
    }

    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
  }, [onFilesSelected]);

  // Ctrl+V paste handler
  useEffect(() => {
    if (!acceptPaste || disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [acceptPaste, disabled, processFiles]);

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
        )}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          disabled={disabled || isCompressing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {isCompressing ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="text-sm">
              <span className="font-medium text-primary">Comprimiendo brochure...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {compressionProgress}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-primary">Click para subir</span>
              <span className="text-muted-foreground"> o arrastra archivos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, Images, Excel (máx 25MB) • Ctrl+V para pegar
            </p>
          </div>
        )}
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, index) => (
            <div
              key={index}
              className="relative group rounded-lg border bg-muted/50 p-2 flex items-center gap-2"
            >
              {f.type === "excel" ? (
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
              ) : f.type === "pdf" ? (
                <FileText className="h-8 w-8 text-red-500" />
              ) : (
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="h-10 w-10 object-cover rounded"
                />
              )}
              <span className="text-xs truncate max-w-[100px]">{f.file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;

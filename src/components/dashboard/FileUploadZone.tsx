import { useCallback, useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  files: FileWithPreview[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export interface FileWithPreview {
  file: File;
  preview: string;
  type: "image" | "pdf";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const FileUploadZone = ({ onFilesSelected, files, onRemoveFile, disabled }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        console.warn(`Tipo de archivo no soportado: ${file.type}`);
        continue;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`Archivo muy grande: ${file.name}`);
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
        type: file.type === "application/pdf" ? "pdf" : "image",
      });
    }

    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
  }, [onFilesSelected]);

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
    <div className="space-y-3">
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
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium text-primary">Click para subir</span>
            <span className="text-muted-foreground"> o arrastra archivos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG (máx 10MB)
          </p>
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, index) => (
            <div
              key={index}
              className="relative group rounded-lg border bg-muted/50 p-2 flex items-center gap-2"
            >
              {f.type === "pdf" ? (
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

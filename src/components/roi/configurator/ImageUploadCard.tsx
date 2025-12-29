import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadCardProps {
  label: string;
  sublabel?: string;
  imageUrl: string | null;
  onImageChange: (file: File | null) => void;
  onRemove: () => void;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "auto";
  placeholder?: string;
  className?: string;
  maxSizeMB?: number;
}

export const ImageUploadCard = ({
  label,
  sublabel,
  imageUrl,
  onImageChange,
  onRemove,
  aspectRatio = "16/9",
  placeholder = "Drag & drop or paste (Ctrl+V)",
  className,
  maxSizeMB = 5,
}: ImageUploadCardProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Update preview when imageUrl prop changes
  useEffect(() => {
    setPreviewUrl(imageUrl);
  }, [imageUrl]);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return false;
    }
    
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File must be less than ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    onImageChange(file);
  }, [onImageChange, maxSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile]);

  // Listen for paste events when this component is focused
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleFocus = () => {
      document.addEventListener('paste', handlePaste);
    };
    
    const handleBlur = () => {
      document.removeEventListener('paste', handlePaste);
    };

    // Also listen globally when hovering
    dropZone.addEventListener('mouseenter', handleFocus);
    dropZone.addEventListener('mouseleave', handleBlur);

    return () => {
      dropZone.removeEventListener('mouseenter', handleFocus);
      dropZone.removeEventListener('mouseleave', handleBlur);
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    onRemove();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const aspectRatioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "auto": "",
  }[aspectRatio];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-white">{label}</label>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
      </div>
      
      <div
        ref={dropZoneRef}
        onClick={!previewUrl ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all overflow-hidden",
          aspectRatioClass,
          previewUrl 
            ? "border-[#2a3142]" 
            : isDragOver 
              ? "border-[#CCFF00] bg-[#CCFF00]/5 cursor-pointer" 
              : "border-[#2a3142] hover:border-[#CCFF00]/50 cursor-pointer",
        )}
      >
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt={label}
              className="w-full h-full object-contain bg-[#0d1117]"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {isDragOver ? (
              <>
                <Upload className="w-8 h-8 text-[#CCFF00] animate-bounce" />
                <p className="text-sm text-[#CCFF00]">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-500" />
                <p className="text-sm text-gray-400 text-center">{placeholder}</p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};
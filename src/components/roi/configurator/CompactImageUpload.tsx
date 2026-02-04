import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompactImageUploadProps {
  label: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export const CompactImageUpload = ({
  label,
  imageUrl,
  onChange,
  className,
}: CompactImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please log in to upload images');
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cashflow-images')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('cashflow-images')
        .getPublicUrl(fileName);
        
      onChange(urlData.publicUrl);
      toast.success(`${label} uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "w-full aspect-square rounded-lg border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1 text-center",
          imageUrl 
            ? "border-theme-accent/50 bg-theme-bg/50" 
            : "border-theme-border hover:border-theme-accent/50 hover:bg-theme-bg-alt/50",
          isUploading && "opacity-50 cursor-wait"
        )}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-theme-text-muted" />
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={label} 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <>
            <ImagePlus className="w-4 h-4 text-theme-text-muted" />
            <span className="text-[9px] text-theme-text-muted leading-tight">{label}</span>
          </>
        )}
      </button>
      
      {imageUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}
      
      {!imageUrl && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-theme-text-muted whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

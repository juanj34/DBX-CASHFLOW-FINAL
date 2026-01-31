import { useState } from "react";
import { Building2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BuildingRenderCardProps {
  imageUrl: string | null;
  developerName?: string;
  className?: string;
}

export const BuildingRenderCard = ({
  imageUrl,
  developerName,
  className,
}: BuildingRenderCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div
        className={cn(
          "bg-card border border-border rounded-xl h-full min-h-0 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No render uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={() => setLightboxOpen(true)}
        className={cn(
          "relative rounded-xl overflow-hidden group cursor-pointer h-full",
          className
        )}
      >
        {/* Background Image - fills full height */}
        <img 
          src={imageUrl} 
          alt="Building Render"
          className="w-full h-full object-cover"
        />

        {/* Developer name overlay if provided */}
        {developerName && (
          <>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30" />
            
            {/* Developer name */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Developer</p>
                <p className="text-white text-xl font-semibold">{developerName}</p>
              </div>
            </div>
          </>
        )}

        {/* Hover overlay for expand */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to enlarge</p>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black/95 border-none">
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Building Render" 
              className="w-full h-auto max-h-[90vh] object-contain"
            />
            {developerName && (
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white font-medium">{developerName}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

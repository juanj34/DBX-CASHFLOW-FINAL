import { useState, useEffect } from "react";
import { Building2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BuildingRenderCardProps {
  imageUrl: string | null;
  developerId?: string | null;
  showLogoOverlay?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BuildingRenderCard = ({
  imageUrl,
  developerId,
  showLogoOverlay = true,
  className,
  onClick,
}: BuildingRenderCardProps) => {
  const [developerLogo, setDeveloperLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeveloperLogo = async () => {
      if (!developerId || !showLogoOverlay) return;
      
      const { data, error } = await supabase
        .from('developers')
        .select('logo_url')
        .eq('id', developerId)
        .maybeSingle();
      
      if (!error && data?.logo_url) {
        setDeveloperLogo(data.logo_url);
      }
    };
    
    fetchDeveloperLogo();
  }, [developerId, showLogoOverlay]);

  if (!imageUrl) {
    return (
      <div className={cn(
        "bg-[#1a1f2e] border border-[#2a3142] rounded-xl aspect-video flex items-center justify-center",
        className
      )}>
        <div className="text-center">
          <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No render uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden aspect-video group",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Background Image */}
      <img 
        src={imageUrl} 
        alt="Building Render"
        className="w-full h-full object-cover"
      />

      {/* Logo Overlay */}
      {showLogoOverlay && developerLogo && (
        <>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Developer logo - white filter */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img 
              src={developerLogo} 
              alt="Developer Logo"
              className="max-w-[40%] max-h-[40%] object-contain filter brightness-0 invert opacity-90"
            />
          </div>
        </>
      )}

      {/* Hover overlay for expand */}
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
};
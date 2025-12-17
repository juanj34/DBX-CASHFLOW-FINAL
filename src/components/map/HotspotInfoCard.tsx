import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HotspotInfoCardProps {
  hotspot: {
    title: string;
    description?: string;
    category: string;
    photos?: string[];
  };
  onClose: () => void;
}

const getCategoryConfig = (category: string): { color: string; label: string } => {
  const configs: Record<string, { color: string; label: string }> = {
    landmark: { color: "bg-blue-500 text-white", label: "Landmark" },
    transportation: { color: "bg-purple-500 text-white", label: "Transportation" },
    attraction: { color: "bg-pink-500 text-white", label: "Attraction" },
    project: { color: "bg-emerald-500 text-white", label: "Project" },
    other: { color: "bg-gray-500 text-white", label: "Other" },
  };
  return configs[category] || { color: "bg-gray-500 text-white", label: category };
};

export const HotspotInfoCard = ({ hotspot, onClose }: HotspotInfoCardProps) => {
  const categoryConfig = getCategoryConfig(hotspot.category);
  const hasImage = hotspot.photos && hotspot.photos.length > 0;

  return (
    <div className="absolute top-4 right-20 w-80 max-h-[80vh] overflow-hidden shadow-xl z-10 bg-[#1a1f2e] border border-[#2a3142] rounded-xl" data-info-card>
      {/* Header with title and category */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-lg leading-tight text-white">{hotspot.title}</h3>
          <Badge className={`${categoryConfig.color} mt-2`}>
            {categoryConfig.label}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0 -mr-2 -mt-1 text-gray-400 hover:text-white hover:bg-[#2a3142]">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image - landscape cover style */}
      {hasImage && (
        <div className="px-4">
          <div className="w-full h-40 rounded-lg overflow-hidden">
            <img
              src={hotspot.photos![0]}
              alt={hotspot.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className={`px-4 pb-4 ${hasImage ? "pt-3" : "pt-0"}`}>
        <p className="font-semibold text-sm mb-1 text-white">Descripción</p>
        {hotspot.description ? (
          <p className="text-sm text-gray-400">{hotspot.description}</p>
        ) : (
          <p className="text-sm text-gray-500 italic">Sin descripción disponible</p>
        )}
      </div>
    </div>
  );
};

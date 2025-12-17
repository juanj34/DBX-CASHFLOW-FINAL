import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="absolute top-4 right-20 w-80 max-h-[80vh] overflow-hidden shadow-lg z-10" data-info-card>
      {/* Header with title and category */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{hotspot.title}</h3>
          <Badge className={`${categoryConfig.color} shrink-0`}>
            {categoryConfig.label}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0 -mr-2 -mt-1">
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
      <CardContent className={hasImage ? "pt-3" : "pt-0"}>
        {hotspot.description ? (
          <p className="text-sm text-muted-foreground">{hotspot.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description available</p>
        )}
      </CardContent>
    </Card>
  );
};

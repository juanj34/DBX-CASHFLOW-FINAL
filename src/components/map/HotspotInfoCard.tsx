import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    landmark: "bg-blue-500",
    metro: "bg-purple-500",
    attraction: "bg-pink-500",
    restaurant: "bg-orange-500",
    shopping: "bg-green-500",
    hotel: "bg-indigo-500",
  };
  return colors[category] || "bg-gray-500";
};

export const HotspotInfoCard = ({ hotspot, onClose }: HotspotInfoCardProps) => {
  return (
    <Card className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-y-auto shadow-lg z-10">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xl">{hotspot.title}</CardTitle>
          <Badge className={getCategoryColor(hotspot.category)}>
            {hotspot.category}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {hotspot.photos && hotspot.photos.length > 0 && (
          <img 
            src={hotspot.photos[0]} 
            alt={hotspot.title}
            className="w-full h-40 object-cover rounded-lg"
          />
        )}
        {hotspot.description && (
          <p className="text-sm text-muted-foreground">{hotspot.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ZoneInfoCardProps {
  zone: {
    name: string;
    description?: string;
    color: string;
    population?: number;
    occupancy_rate?: number;
    absorption_rate?: number;
    image_url?: string;
  };
  onClose: () => void;
}

export const ZoneInfoCard = ({ zone, onClose }: ZoneInfoCardProps) => {
  return (
    <Card className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-y-auto shadow-lg z-10" data-info-card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-xl">{zone.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {zone.image_url && (
          <img 
            src={zone.image_url} 
            alt={zone.name}
            className="w-full h-40 object-cover rounded-lg"
          />
        )}
        {zone.description && (
          <p className="text-sm text-muted-foreground">{zone.description}</p>
        )}
        <div className="space-y-2">
          {zone.population !== null && zone.population !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Population:</span>
              <span>{zone.population.toLocaleString()}</span>
            </div>
          )}
          {zone.occupancy_rate !== null && zone.occupancy_rate !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Occupancy Rate:</span>
              <span>{zone.occupancy_rate}%</span>
            </div>
          )}
          {zone.absorption_rate !== null && zone.absorption_rate !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Absorption Rate:</span>
              <span>{zone.absorption_rate}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

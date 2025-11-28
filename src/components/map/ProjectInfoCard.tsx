import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ProjectInfoCardProps {
  project: {
    name?: string;
    description?: string;
    developer?: string;
    starting_price?: number;
    price_per_sqft?: number;
    areas_from?: number;
    unit_types?: string[];
    launch_date?: string;
    delivery_date?: string;
    construction_status?: string;
  };
  onClose: () => void;
}

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    planned: "bg-amber-500",
    under_construction: "bg-blue-500",
    completed: "bg-green-500",
  };
  return colors[status || ""] || "bg-gray-500";
};

export const ProjectInfoCard = ({ project, onClose }: ProjectInfoCardProps) => {
  return (
    <Card className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-y-auto shadow-lg z-10" data-info-card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xl">{project.name || "Untitled Project"}</CardTitle>
          {project.construction_status && (
            <Badge className={getStatusColor(project.construction_status)}>
              {project.construction_status.replace("_", " ")}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.developer && (
          <div className="text-sm">
            <span className="font-medium">Developer:</span> {project.developer}
          </div>
        )}
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <div className="space-y-2">
          {project.starting_price && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Starting Price:</span>
              <span>AED {project.starting_price.toLocaleString()}</span>
            </div>
          )}
          {project.price_per_sqft && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Price/sqft:</span>
              <span>AED {project.price_per_sqft.toLocaleString()}</span>
            </div>
          )}
          {project.areas_from && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Areas from:</span>
              <span>{project.areas_from} sqft</span>
            </div>
          )}
          {project.unit_types && project.unit_types.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Unit Types:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.unit_types.map((type, idx) => (
                  <Badge key={idx} variant="outline">{type}</Badge>
                ))}
              </div>
            </div>
          )}
          {project.launch_date && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Launch Date:</span>
              <span>{format(new Date(project.launch_date), "MMM yyyy")}</span>
            </div>
          )}
          {project.delivery_date && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Delivery Date:</span>
              <span>{format(new Date(project.delivery_date), "MMM yyyy")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

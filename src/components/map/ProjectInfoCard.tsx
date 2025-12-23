import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ProjectInfoCardProps {
  project: {
    name?: string;
    description?: string;
    developer?: string;
    image_url?: string;
    developer_info?: {
      name?: string;
      logo_url?: string;
    };
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
    off_plan: "bg-amber-500",
    under_construction: "bg-blue-500",
    ready: "bg-green-500",
  };
  return colors[status || ""] || "bg-gray-500";
};

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    off_plan: "Off Plan",
    under_construction: "Under Construction",
    ready: "Ready",
  };
  return labels[status || ""] || status?.replace("_", " ") || "Unknown";
};

export const ProjectInfoCard = ({ project, onClose }: ProjectInfoCardProps) => {
  const developerName = project.developer_info?.name || project.developer;
  const developerLogo = project.developer_info?.logo_url;

  return (
    <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-20 w-auto sm:w-80 max-h-[80vh] overflow-y-auto shadow-xl z-10 bg-[#1a1f2e] border border-[#2a3142] rounded-xl" data-info-card>
      {/* Project Image Header */}
      {project.image_url && (
        <div className="relative w-full h-40">
          <img
            src={project.image_url}
            alt={project.name || "Project"}
            className="w-full h-full object-cover rounded-t-xl"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className={`flex flex-row items-start justify-between space-y-0 p-4 pb-3 ${project.image_url ? 'pt-3' : ''}`}>
        <div className="space-y-1 flex-1">
          <h3 className="text-xl font-semibold text-white">{project.name || "Untitled Project"}</h3>
          {project.construction_status && (
            <Badge className={getStatusColor(project.construction_status)}>
              {getStatusLabel(project.construction_status)}
            </Badge>
          )}
        </div>
        {!project.image_url && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a3142]">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="px-4 pb-4 space-y-4">
        {/* Developer with logo */}
        {developerName && (
          <div className="flex items-center gap-3 p-2 bg-[#0d1117] rounded-lg">
            {developerLogo ? (
              <img
                src={developerLogo}
                alt={developerName}
                className="w-10 h-10 object-contain rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-[#2a3142] rounded flex items-center justify-center text-xs font-medium text-gray-400">
                {developerName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Developer</p>
              <p className="font-medium text-sm text-white">{developerName}</p>
            </div>
          </div>
        )}
        
        {project.description && (
          <div>
            <p className="font-semibold text-sm mb-1 text-white">Descripción</p>
            <p className="text-sm text-gray-400">{project.description}</p>
          </div>
        )}
        
        <div className="space-y-2">
          {project.starting_price && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">Starting Price:</span>
              <span className="text-gray-400">AED {project.starting_price.toLocaleString()}</span>
            </div>
          )}
          {project.price_per_sqft && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">Price/sqft:</span>
              <span className="text-gray-400">AED {project.price_per_sqft.toLocaleString()}</span>
            </div>
          )}
          {project.areas_from && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">Areas from:</span>
              <span className="text-gray-400">{project.areas_from} sqft</span>
            </div>
          )}
          {project.unit_types && project.unit_types.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-white">Unit Types:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.unit_types.map((type, idx) => (
                  <Badge key={idx} variant="outline" className="border-[#2a3142] text-gray-400">{type}</Badge>
                ))}
              </div>
            </div>
          )}
          {project.launch_date && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">Launch Date:</span>
              <span className="text-gray-400">{format(new Date(project.launch_date), "MMM yyyy")}</span>
            </div>
          )}
          {project.delivery_date && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">Delivery Date:</span>
              <span className="text-gray-400">{format(new Date(project.delivery_date), "MMM yyyy")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

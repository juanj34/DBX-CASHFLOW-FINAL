import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2, MapPin, Building2, Landmark } from "lucide-react";

interface ProjectData {
  type: "project";
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
  description?: string;
  developer?: string;
  starting_price?: number;
  price_per_sqft?: number;
  unit_types?: string[];
  areas_from?: number;
  launch_date?: string;
  delivery_date?: string;
  construction_status?: string;
}

interface HotspotData {
  type: "hotspot";
  title: string;
  location?: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
}

type PreviewData = ProjectData | HotspotData;

interface PreviewCardProps {
  data: PreviewData;
  onConfirm: (data: PreviewData) => void;
  onCancel: () => void;
  onEdit?: (data: PreviewData) => void;
  needsCoordinates?: boolean;
  isLoading?: boolean;
}

const formatPrice = (price?: number) => {
  if (!price) return "—";
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(price);
};

const statusLabels: Record<string, string> = {
  off_plan: "Off Plan",
  under_construction: "Under Construction",
  ready: "Ready",
};

const categoryLabels: Record<string, string> = {
  landmark: "Landmark",
  transportation: "Transportation",
  attraction: "Attraction",
  project: "Project",
  other: "Other",
};

const PreviewCard = ({ data, onConfirm, onCancel, onEdit, needsCoordinates, isLoading }: PreviewCardProps) => {
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    // Validate Dubai bounds roughly
    if (lat < 24.7 || lat > 25.6 || lng < 54.9 || lng > 56.5) {
      alert("Las coordenadas deben estar dentro de Dubai/UAE");
      return;
    }
    
    onConfirm({ ...data, latitude: lat, longitude: lng });
  };

  const isProject = data.type === "project";
  const projectData = data as ProjectData;
  const hotspotData = data as HotspotData;

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isProject ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <Landmark className="h-5 w-5 text-primary" />
            )}
            {isProject ? projectData.name : hotspotData.title}
          </CardTitle>
          <Badge variant={isProject ? "default" : "secondary"}>
            {isProject ? "Proyecto" : categoryLabels[hotspotData.category] || hotspotData.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{data.location || "Ubicación extraída"}</p>
            {!needsCoordinates && (
              <p className="text-xs text-muted-foreground">
                {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Manual coordinates input if needed */}
        {needsCoordinates && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              No se encontraron coordenadas. Ingresa manualmente:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Latitud</Label>
                <Input
                  placeholder="25.2048"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
              <div>
                <Label className="text-xs">Longitud</Label>
                <Input
                  placeholder="55.2708"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleManualCoordinates} className="w-full">
              Usar coordenadas
            </Button>
          </div>
        )}

        {/* Project-specific fields */}
        {isProject && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {projectData.developer && (
              <div>
                <p className="text-muted-foreground text-xs">Developer</p>
                <p className="font-medium">{projectData.developer}</p>
              </div>
            )}
            {projectData.starting_price && (
              <div>
                <p className="text-muted-foreground text-xs">Precio desde</p>
                <p className="font-medium">{formatPrice(projectData.starting_price)}</p>
              </div>
            )}
            {projectData.price_per_sqft && (
              <div>
                <p className="text-muted-foreground text-xs">Precio/sqft</p>
                <p className="font-medium">{formatPrice(projectData.price_per_sqft)}</p>
              </div>
            )}
            {projectData.areas_from && (
              <div>
                <p className="text-muted-foreground text-xs">Área desde</p>
                <p className="font-medium">{projectData.areas_from} sq.ft</p>
              </div>
            )}
            {projectData.unit_types && projectData.unit_types.length > 0 && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Tipos de unidad</p>
                <div className="flex flex-wrap gap-1">
                  {projectData.unit_types.map((type, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {projectData.delivery_date && (
              <div>
                <p className="text-muted-foreground text-xs">Entrega</p>
                <p className="font-medium">{projectData.delivery_date}</p>
              </div>
            )}
            {projectData.construction_status && (
              <div>
                <p className="text-muted-foreground text-xs">Estado</p>
                <Badge variant="outline">
                  {statusLabels[projectData.construction_status] || projectData.construction_status}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {(projectData.description || hotspotData.description) && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Descripción</p>
            <p className="line-clamp-3">{projectData.description || hotspotData.description}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        {!needsCoordinates && (
          <>
            <Button
              onClick={() => onConfirm(data)}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(data)}
                disabled={isLoading}
                size="sm"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          size="sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PreviewCard;

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2, MapPin, Building2, Landmark, RefreshCw, Users, Globe, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectData {
  type: "project";
  id?: string;
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
  description?: string;
  developer?: string;
  developer_id?: string;
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
  id?: string;
  title: string;
  location?: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
}

interface DeveloperData {
  type: "developer";
  id?: string;
  name: string;
  logo_url?: string;
  white_logo_url?: string;
  website?: string;
  description?: string;
  short_bio?: string;
  headquarters?: string;
  founded_year?: number;
  projects_launched?: number;
  units_sold?: number;
  flagship_project?: string;
  rating_quality?: number;
  rating_track_record?: number;
  rating_sales?: number;
  rating_design?: number;
  rating_flip_potential?: number;
  score_maintenance?: number;
  on_time_delivery_rate?: number;
  occupancy_rate?: number;
}

interface ProjectsBatchData {
  type: "projects_batch";
  developer_id: string;
  developer_name: string;
  projects: Array<Omit<ProjectData, 'type'> & { geocoded?: boolean }>;
}

type PreviewData = ProjectData | HotspotData | DeveloperData | ProjectsBatchData;

interface PreviewCardProps {
  data: PreviewData;
  onConfirm: (data: PreviewData) => void;
  onCancel: () => void;
  onEdit?: (data: PreviewData) => void;
  needsCoordinates?: boolean;
  isLoading?: boolean;
  isEditing?: boolean;
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

const RatingStars = ({ rating, label }: { rating?: number; label: string }) => {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < Math.round(rating / 2) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium">{rating}/10</span>
    </div>
  );
};

const PreviewCard = ({ data, onConfirm, onCancel, onEdit, needsCoordinates, isLoading, isEditing }: PreviewCardProps) => {
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set([0]));

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    if (lat < 24.7 || lat > 25.6 || lng < 54.9 || lng > 56.5) {
      alert("Las coordenadas deben estar dentro de Dubai/UAE");
      return;
    }
    
    onConfirm({ ...data, latitude: lat, longitude: lng } as PreviewData);
  };

  const toggleProject = (index: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const isProject = data.type === "project";
  const isHotspot = data.type === "hotspot";
  const isDeveloper = data.type === "developer";
  const isProjectsBatch = data.type === "projects_batch";
  const projectData = data as ProjectData;
  const hotspotData = data as HotspotData;
  const developerData = data as DeveloperData;
  const batchData = data as ProjectsBatchData;

  // Handle batch projects preview
  if (isProjectsBatch) {
    const geocodedCount = batchData.projects.filter(p => p.geocoded).length;
    const needsGeocodingCount = batchData.projects.filter(p => !p.geocoded).length;
    
    return (
      <Card className="shadow-lg border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {batchData.developer_name} - {batchData.projects.length} Projects
            </CardTitle>
            <Badge variant="default">Batch Import</Badge>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-green-600 border-green-300">
              <Check className="h-3 w-3 mr-1" />
              {geocodedCount} geocoded
            </Badge>
            {needsGeocodingCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <MapPin className="h-3 w-3 mr-1" />
                {needsGeocodingCount} pending
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {batchData.projects.map((project, index) => (
            <div 
              key={index}
              className={cn(
                "border rounded-lg transition-all",
                project.geocoded ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"
              )}
            >
              <button
                onClick={() => toggleProject(index)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  {project.geocoded ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="font-medium">{project.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {expandedProjects.has(index) ? '▲' : '▼'}
                </span>
              </button>
              
              {expandedProjects.has(index) && (
                <div className="px-3 pb-3 space-y-2 text-sm border-t">
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {project.starting_price && (
                      <div>
                        <p className="text-muted-foreground text-xs">Precio desde</p>
                        <p className="font-medium">{formatPrice(project.starting_price)}</p>
                      </div>
                    )}
                    {project.delivery_date && (
                      <div>
                        <p className="text-muted-foreground text-xs">Entrega</p>
                        <p className="font-medium">{project.delivery_date}</p>
                      </div>
                    )}
                  </div>
                  {project.unit_types && project.unit_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.unit_types.map((type, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {!project.geocoded && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Coordenadas no encontradas - se geocodificará al crear
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>

        <CardFooter className="gap-2 pt-0">
          <Button
            onClick={() => onConfirm(data)}
            disabled={isLoading}
            className="flex-1"
            size="sm"
          >
            <Check className="h-4 w-4 mr-1" />
            Crear {batchData.projects.length} Proyectos
          </Button>
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
  }

  return (
    <Card className={`shadow-lg ${isEditing ? "border-amber-500/50" : "border-primary/50"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isProject && <Building2 className="h-5 w-5 text-primary" />}
            {isHotspot && <Landmark className="h-5 w-5 text-primary" />}
            {isDeveloper && <Users className="h-5 w-5 text-primary" />}
            {isProject ? projectData.name : isHotspot ? hotspotData.title : developerData.name}
          </CardTitle>
          <div className="flex gap-1">
            {isEditing && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <RefreshCw className="h-3 w-3 mr-1" />
                Editando
              </Badge>
            )}
            <Badge variant={isProject ? "default" : isDeveloper ? "outline" : "secondary"}>
              {isProject ? "Proyecto" : isDeveloper ? "Developer" : categoryLabels[hotspotData.category] || hotspotData.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location for projects/hotspots */}
        {(isProject || isHotspot) && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{isProject ? projectData.location : hotspotData.location || "Ubicación extraída"}</p>
              {!needsCoordinates && (
                <p className="text-xs text-muted-foreground">
                  {isProject ? projectData.latitude?.toFixed(6) : hotspotData.latitude?.toFixed(6)}, {isProject ? projectData.longitude?.toFixed(6) : hotspotData.longitude?.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Manual coordinates input if needed */}
        {needsCoordinates && !isDeveloper && (
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

        {/* Developer-specific fields */}
        {isDeveloper && (
          <div className="space-y-3">
            {/* Logo and website */}
            <div className="flex items-center gap-3">
              {(developerData.logo_url || developerData.white_logo_url) && (
                <img 
                  src={developerData.logo_url || developerData.white_logo_url} 
                  alt={developerData.name} 
                  className="h-12 w-12 object-contain rounded bg-white p-1"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <div className="flex-1">
                {developerData.website && (
                  <a href={developerData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Globe className="h-3 w-3" />
                    {developerData.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
                {developerData.headquarters && (
                  <p className="text-xs text-muted-foreground">{developerData.headquarters}</p>
                )}
              </div>
            </div>

            {/* Short bio */}
            {developerData.short_bio && (
              <p className="text-sm italic text-muted-foreground">{developerData.short_bio}</p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {developerData.founded_year && (
                <div>
                  <p className="text-muted-foreground text-xs">Fundado</p>
                  <p className="font-medium">{developerData.founded_year}</p>
                </div>
              )}
              {developerData.projects_launched && (
                <div>
                  <p className="text-muted-foreground text-xs">Proyectos</p>
                  <p className="font-medium">{developerData.projects_launched}</p>
                </div>
              )}
              {developerData.units_sold && (
                <div>
                  <p className="text-muted-foreground text-xs">Unidades vendidas</p>
                  <p className="font-medium">{developerData.units_sold.toLocaleString()}</p>
                </div>
              )}
              {developerData.flagship_project && (
                <div>
                  <p className="text-muted-foreground text-xs">Proyecto insignia</p>
                  <p className="font-medium">{developerData.flagship_project}</p>
                </div>
              )}
              {developerData.on_time_delivery_rate && (
                <div>
                  <p className="text-muted-foreground text-xs">Entrega a tiempo</p>
                  <p className="font-medium">{developerData.on_time_delivery_rate}%</p>
                </div>
              )}
              {developerData.occupancy_rate && (
                <div>
                  <p className="text-muted-foreground text-xs">Ocupación</p>
                  <p className="font-medium">{developerData.occupancy_rate}%</p>
                </div>
              )}
            </div>

            {/* Ratings */}
            <div className="space-y-1.5 pt-2 border-t">
              <RatingStars rating={developerData.rating_quality} label="Calidad" />
              <RatingStars rating={developerData.rating_track_record} label="Track Record" />
              <RatingStars rating={developerData.rating_design} label="Diseño" />
              <RatingStars rating={developerData.rating_sales} label="Ventas" />
              <RatingStars rating={developerData.rating_flip_potential} label="Flip Potential" />
              <RatingStars rating={developerData.score_maintenance} label="Mantenimiento" />
            </div>
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
        {(projectData.description || hotspotData.description || developerData.description) && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Descripción</p>
            <p className="line-clamp-3">{projectData.description || hotspotData.description || developerData.description}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        {(!needsCoordinates || isDeveloper) && (
          <>
            <Button
              onClick={() => onConfirm(data)}
              disabled={isLoading}
              className={`flex-1 ${isEditing ? "bg-amber-600 hover:bg-amber-700" : ""}`}
              size="sm"
            >
              <Check className="h-4 w-4 mr-1" />
              {isEditing ? "Actualizar" : "Crear"}
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

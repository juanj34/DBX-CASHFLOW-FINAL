import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Home, Layers, MapPin, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface ProjectData {
  id: string;
  name: string | null;
  logo_url?: string | null;
  image_url?: string | null;
  description?: string | null;
  developer?: string | null;
  total_units?: number | null;
  total_towers?: number | null;
  total_villas?: number | null;
  phases?: number | null;
  is_masterplan?: boolean | null;
  launch_date?: string | null;
  delivery_date?: string | null;
  construction_status?: string | null;
  starting_price?: number | null;
  price_per_sqft?: number | null;
  areas_from?: number | null;
  unit_types?: string[] | null;
  zone_id?: string | null;
  updated_at?: string;
}

interface ProjectInfoModalProps {
  project: ProjectData | null;
  zoneName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectInfoModal = ({ project, zoneName, open, onOpenChange }: ProjectInfoModalProps) => {
  const { t } = useLanguage();

  if (!project) return null;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'under_construction': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'off_plan': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'under_construction': return 'Under Construction';
      case 'off_plan': return 'Off-Plan';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            {project.logo_url ? (
              <img src={project.logo_url} alt={project.name || ''} className="w-10 h-10 rounded-lg object-contain bg-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#CCFF00]" />
              </div>
            )}
            <span>{project.name || 'Project'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Project Image */}
          {project.image_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-[#0d1117]">
              <img 
                src={project.image_url} 
                alt={project.name || ''} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Status & Type Badges */}
          <div className="flex flex-wrap gap-2">
            {project.construction_status && (
              <Badge className={getStatusColor(project.construction_status)}>
                {getStatusLabel(project.construction_status)}
              </Badge>
            )}
            {project.is_masterplan && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Masterplan
              </Badge>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Units */}
            {project.total_units && (
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#2a3142]">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-xs text-gray-500">Total Units</span>
                </div>
                <p className="text-lg font-bold text-white">{project.total_units.toLocaleString()}</p>
              </div>
            )}

            {/* Towers */}
            {project.total_towers && (
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#2a3142]">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-[#00EAFF]" />
                  <span className="text-xs text-gray-500">Towers</span>
                </div>
                <p className="text-lg font-bold text-white">{project.total_towers}</p>
              </div>
            )}

            {/* Villas */}
            {project.total_villas && (
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#2a3142]">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500">Villas</span>
                </div>
                <p className="text-lg font-bold text-white">{project.total_villas}</p>
              </div>
            )}

            {/* Phases */}
            {project.phases && project.phases > 1 && (
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#2a3142]">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500">Phases</span>
                </div>
                <p className="text-lg font-bold text-white">{project.phases}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {(project.launch_date || project.delivery_date) && (
            <div className="bg-[#0d1117] rounded-xl p-4 border border-[#2a3142]">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-[#CCFF00]" />
                <span className="text-sm font-medium text-white">Timeline</span>
              </div>
              <div className="flex items-center gap-3">
                {project.launch_date && (
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Launch</p>
                    <p className="text-sm font-medium text-white">{formatDate(project.launch_date)}</p>
                  </div>
                )}
                {project.launch_date && project.delivery_date && (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                {project.delivery_date && (
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Delivery</p>
                    <p className="text-sm font-medium text-[#CCFF00]">{formatDate(project.delivery_date)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {(project.starting_price || project.price_per_sqft) && (
            <div className="bg-[#0d1117] rounded-xl p-4 border border-[#2a3142]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#CCFF00] font-bold">AED</span>
                <span className="text-sm font-medium text-white">Pricing</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {project.starting_price && (
                  <div>
                    <p className="text-xs text-gray-500">Starting from</p>
                    <p className="text-sm font-medium text-white">
                      AED {project.starting_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {project.price_per_sqft && (
                  <div>
                    <p className="text-xs text-gray-500">Price/sqft</p>
                    <p className="text-sm font-medium text-white">
                      AED {project.price_per_sqft.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zone & Location */}
          {zoneName && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{zoneName}</span>
            </div>
          )}

          {/* Unit Types */}
          {project.unit_types && project.unit_types.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Available Unit Types</p>
              <div className="flex flex-wrap gap-1.5">
                {project.unit_types.map((type, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-[#2a3142] text-gray-300">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          {project.updated_at && (
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-[#2a3142]">
              <Clock className="w-3 h-3" />
              <span>Last updated: {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

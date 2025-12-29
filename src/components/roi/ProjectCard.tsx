import { useState, useEffect } from "react";
import { Building2, Calendar, ChevronRight, Home, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string | null;
  logo_url: string | null;
  image_url: string | null;
  total_units: number | null;
  total_towers: number | null;
  phases: number | null;
  delivery_date: string | null;
  construction_status: string | null;
}

interface ProjectCardProps {
  projectId: string | null;
  projectName?: string;
  onClick?: () => void;
  className?: string;
}

export const ProjectCard = ({ 
  projectId, 
  projectName,
  onClick,
  className 
}: ProjectCardProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, logo_url, image_url, total_units, total_towers, phases, delivery_date, construction_status')
        .eq('id', projectId)
        .maybeSingle();
      
      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    };
    
    fetchProject();
  }, [projectId]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ready': return { text: 'Ready', color: 'text-green-400 bg-green-400/10' };
      case 'under_construction': return { text: 'Under Construction', color: 'text-yellow-400 bg-yellow-400/10' };
      case 'off_plan': return { text: 'Off-Plan', color: 'text-blue-400 bg-blue-400/10' };
      default: return null;
    }
  };

  const statusBadge = project ? getStatusBadge(project.construction_status) : null;

  if (!projectId && !projectName) return null;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 transition-all",
        onClick && "cursor-pointer hover:border-[#CCFF00]/30 hover:bg-[#1a1f2e]/80",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Logo/Image */}
        {project?.logo_url || project?.image_url ? (
          <img 
            src={project.logo_url || project.image_url || ''} 
            alt={project.name || ''}
            className="w-12 h-12 rounded-lg object-cover border border-[#2a3142]"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#2a3142] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-500" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {project?.name || projectName || 'Unknown Project'}
          </p>
          
          {project && (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {project.total_units && (
                <div className="flex items-center gap-1">
                  <Home className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-400">{project.total_units} units</span>
                </div>
              )}
              {project.total_towers && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-400">{project.total_towers} towers</span>
                </div>
              )}
              {project.phases && project.phases > 1 && (
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-400">{project.phases} phases</span>
                </div>
              )}
            </div>
          )}
          
          {project?.delivery_date && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-[#CCFF00]" />
              <span className="text-xs text-[#CCFF00]">
                Delivery: {format(new Date(project.delivery_date), 'MMM yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge + Arrow */}
        <div className="flex items-center gap-2">
          {statusBadge && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusBadge.color)}>
              {statusBadge.text}
            </span>
          )}
          {onClick && (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
};

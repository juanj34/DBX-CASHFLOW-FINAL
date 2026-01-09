import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string | null;
  logo_url: string | null;
  construction_status: 'off_plan' | 'under_construction' | 'ready' | null;
}

interface ShowcaseProjectCardProps {
  projectName: string;
  projectId?: string;
  className?: string;
  onClick?: () => void;
}

const getStatusBadge = (status: string | null) => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    'off_plan': { label: 'OFF-PLAN', color: 'bg-blue-500/20 text-blue-300', icon: '🏗️' },
    'under_construction': { label: 'BUILDING', color: 'bg-yellow-500/20 text-yellow-300', icon: '🔨' },
    'ready': { label: 'READY', color: 'bg-green-500/20 text-green-300', icon: '✅' },
  };
  return status ? map[status] || null : null;
};

export const ShowcaseProjectCard: React.FC<ShowcaseProjectCardProps> = ({
  projectName,
  projectId,
  className,
  onClick,
}) => {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (projectId) {
        const { data } = await supabase.from('projects').select('id, name, logo_url, construction_status').eq('id', projectId).maybeSingle();
        if (data) setProject(data);
      } else if (projectName) {
        const { data } = await supabase.from('projects').select('id, name, logo_url, construction_status').ilike('name', `%${projectName}%`).maybeSingle();
        if (data) setProject(data);
      }
    };
    fetchData();
  }, [projectId, projectName]);

  const statusBadge = project ? getStatusBadge(project.construction_status) : null;

  return (
    <div 
      className={cn(
        "bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl",
        onClick && "cursor-pointer hover:bg-white/10 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {project?.logo_url ? (
          <img src={project.logo_url} alt={projectName} className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Project</p>
          <p className="text-sm font-semibold text-white truncate">{project?.name || projectName || 'Project'}</p>
        </div>
        {statusBadge && (
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0", statusBadge.color)}>
            {statusBadge.icon} {statusBadge.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ShowcaseProjectCard;

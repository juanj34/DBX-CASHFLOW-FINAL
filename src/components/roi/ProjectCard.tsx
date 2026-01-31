import { Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  projectName?: string;
  onClick?: () => void;
  className?: string;
}

export const ProjectCard = ({ 
  projectName,
  onClick,
  className 
}: ProjectCardProps) => {
  if (!projectName) return null;

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
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-[#2a3142] flex items-center justify-center">
          <Building2 className="w-6 h-6 text-gray-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {projectName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Project</p>
        </div>

        {/* Arrow */}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </div>
    </div>
  );
};

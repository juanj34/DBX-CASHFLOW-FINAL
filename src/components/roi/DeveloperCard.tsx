import { Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeveloperCardProps {
  developerName?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const DeveloperCard = ({ 
  developerName,
  onClick,
  className,
  variant = 'default'
}: DeveloperCardProps) => {
  if (!developerName) return null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative rounded-2xl p-4 transition-all duration-300 group overflow-hidden",
          onClick && "cursor-pointer",
          className
        )}
        style={{
          backgroundColor: '#0f1318',
          border: '1px solid #1e2632',
        }}
      >
        <div className="relative flex items-center gap-4">
          {/* Developer Icon */}
          <div className="relative flex-shrink-0">
            <div 
              className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, #2a3142 0%, #1a1f2e 100%)',
                border: '2px solid #2a314250',
              }}
            >
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate block">
              {developerName}
            </span>
            <span className="text-xs text-gray-500">Developer</span>
          </div>

          {onClick && (
            <ChevronRight 
              className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" 
            />
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-[#1a1f2e] border border-[#2a3142] rounded-xl overflow-hidden transition-all",
        onClick && "cursor-pointer hover:border-[#CCFF00]/40 hover:shadow-lg hover:shadow-[#CCFF00]/5",
        className
      )}
    >
      {/* Header with icon */}
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-[#2a3142] flex items-center justify-center flex-shrink-0">
          <Building2 className="w-7 h-7 text-gray-500" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white truncate">
            {developerName}
          </p>
          <p className="text-xs text-gray-400 mt-1">Developer</p>
        </div>

        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

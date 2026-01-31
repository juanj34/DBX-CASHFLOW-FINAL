import React from 'react';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShowcaseDeveloperCardProps {
  developerName: string;
  className?: string;
  onClick?: () => void;
}

export const ShowcaseDeveloperCard: React.FC<ShowcaseDeveloperCardProps> = ({
  developerName,
  className,
  onClick,
}) => {
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
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Building className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Developer</p>
          <p className="text-sm font-semibold text-white truncate">{developerName || 'Developer'}</p>
        </div>
      </div>
    </div>
  );
};

export default ShowcaseDeveloperCard;

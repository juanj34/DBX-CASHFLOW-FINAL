import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueDifferentiatorsBadgesProps {
  differentiators: string[];
  appreciationBonus: number;
}

const DIFFERENTIATOR_LABELS: Record<string, { label: string; color: string }> = {
  'waterfront': { label: 'Waterfront', color: 'bg-theme-info/20 text-theme-info' },
  'ocean-view': { label: 'Ocean View', color: 'bg-theme-rental/20 text-theme-rental' },
  'master-community': { label: 'Master Community', color: 'bg-theme-exit/20 text-theme-exit' },
  'emerging-zone': { label: 'Emerging Zone', color: 'bg-theme-warning/20 text-theme-warning' },
  'corner-unit': { label: 'Corner Unit', color: 'bg-theme-positive/20 text-theme-positive' },
  'top-floor': { label: 'Top Floor', color: 'bg-theme-accent-secondary/20 text-theme-accent-secondary' },
  'skyline-view': { label: 'Skyline View', color: 'bg-theme-exit/20 text-theme-exit' },
  'premium-developer': { label: 'Premium Developer', color: 'bg-theme-accent/20 text-theme-accent' },
  'metro-adjacent': { label: 'Metro Adjacent', color: 'bg-theme-negative/20 text-theme-negative' },
};

export const ValueDifferentiatorsBadges = ({
  differentiators,
  appreciationBonus,
}: ValueDifferentiatorsBadgesProps) => {
  if (differentiators.length === 0) return null;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          Value Differentiators
        </h3>
        
        {appreciationBonus > 0 && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
            +{appreciationBonus.toFixed(1)}% bonus
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {differentiators.map((id) => {
          const config = DIFFERENTIATOR_LABELS[id] || { 
            label: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            color: 'bg-theme-bg text-theme-text-muted' 
          };
          
          return (
            <span 
              key={id}
              className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                config.color
              )}
            >
              {config.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

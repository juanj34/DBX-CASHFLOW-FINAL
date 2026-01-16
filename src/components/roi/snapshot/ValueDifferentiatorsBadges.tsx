import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueDifferentiatorsBadgesProps {
  differentiators: string[];
  appreciationBonus: number;
}

const DIFFERENTIATOR_LABELS: Record<string, { label: string; color: string }> = {
  'waterfront': { label: 'Waterfront', color: 'bg-blue-500/20 text-blue-500' },
  'ocean-view': { label: 'Ocean View', color: 'bg-cyan-500/20 text-cyan-500' },
  'master-community': { label: 'Master Community', color: 'bg-purple-500/20 text-purple-500' },
  'emerging-zone': { label: 'Emerging Zone', color: 'bg-orange-500/20 text-orange-500' },
  'corner-unit': { label: 'Corner Unit', color: 'bg-green-500/20 text-green-500' },
  'top-floor': { label: 'Top Floor', color: 'bg-indigo-500/20 text-indigo-500' },
  'skyline-view': { label: 'Skyline View', color: 'bg-pink-500/20 text-pink-500' },
  'premium-developer': { label: 'Premium Developer', color: 'bg-yellow-500/20 text-yellow-600' },
  'metro-adjacent': { label: 'Metro Adjacent', color: 'bg-red-500/20 text-red-500' },
};

export const ValueDifferentiatorsBadges = ({
  differentiators,
  appreciationBonus,
}: ValueDifferentiatorsBadgesProps) => {
  if (differentiators.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Value Differentiators
        </h3>
        
        {appreciationBonus > 0 && (
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-medium">
            +{appreciationBonus.toFixed(1)}% appreciation bonus
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {differentiators.map((id) => {
          const config = DIFFERENTIATOR_LABELS[id] || { 
            label: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            color: 'bg-muted text-muted-foreground' 
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

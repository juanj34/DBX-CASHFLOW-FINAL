import { Link, useNavigate } from 'react-router-dom';
import { Scale, ArrowRight, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedComparisons } from '@/hooks/useSavedComparisons';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentComparisonsProps {
  limit?: number;
}

export const RecentComparisons = ({ limit = 3 }: RecentComparisonsProps) => {
  const { comparisons, loading } = useSavedComparisons();
  const navigate = useNavigate();

  const recentComparisons = comparisons.slice(0, limit);

  const handleLoadComparison = (comparison: typeof comparisons[0]) => {
    navigate(`/compare?ids=${comparison.quote_ids.join(',')}`);
  };

  if (loading) {
    return (
      <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-orange-400" />
          <h3 className="font-semibold text-theme-text">Recent Comparisons</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-theme-bg-alt flex items-center justify-center">
            <Scale className="w-6 h-6 text-theme-text-muted opacity-50" />
          </div>
          <p className="text-sm text-theme-text-muted mb-3">No saved comparisons yet</p>
          <Link to="/compare">
            <Button variant="outline" size="sm" className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt">
              Start Comparing
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" />
          <h3 className="font-semibold text-theme-text">Recent Comparisons</h3>
        </div>
        <Link to="/compare">
          <Button variant="link" className="text-theme-accent hover:text-theme-accent/80 p-0 text-xs h-auto">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {recentComparisons.map((comparison) => (
          <button
            key={comparison.id}
            onClick={() => handleLoadComparison(comparison)}
            className="w-full text-left p-3 rounded-xl bg-theme-bg-alt hover:bg-theme-card-alt border border-transparent hover:border-orange-500/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-theme-text text-sm truncate group-hover:text-orange-400 transition-colors">
                  {comparison.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-theme-text-muted">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {comparison.quote_ids.length} quotes
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(comparison.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>

      {comparisons.length > limit && (
        <Link to="/compare" className="block mt-3">
          <Button 
            variant="ghost" 
            className="w-full text-xs text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
          >
            + {comparisons.length - limit} more comparisons
          </Button>
        </Link>
      )}
    </div>
  );
};

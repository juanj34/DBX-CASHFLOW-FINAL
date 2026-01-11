import { Link, useNavigate } from 'react-router-dom';
import { Presentation, ArrowRight, Clock, Layers, Share2, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresentations } from '@/hooks/usePresentations';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RecentPresentationsProps {
  limit?: number;
}

export const RecentPresentations = ({ limit = 5 }: RecentPresentationsProps) => {
  const { presentations, loading, duplicatePresentation, generateShareToken } = usePresentations();
  const navigate = useNavigate();

  const recentPresentations = presentations.slice(0, limit);

  const handleOpen = (id: string) => {
    navigate(`/presentations/${id}`);
  };

  const handleShare = async (id: string) => {
    const token = await generateShareToken(id);
    if (token) {
      const url = `${window.location.origin}/present/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    }
  };

  const handleDuplicate = async (id: string) => {
    const newId = await duplicatePresentation(id);
    if (newId) {
      toast.success("Presentation duplicated");
      navigate(`/presentations/${newId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Presentation className="w-4 h-4 text-pink-400" />
          <h3 className="font-semibold text-theme-text">Recent Presentations</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-theme-bg-alt flex items-center justify-center">
            <Presentation className="w-6 h-6 text-theme-text-muted opacity-50" />
          </div>
          <p className="text-sm text-theme-text-muted mb-3">No presentations yet</p>
          <Link to="/presentations">
            <Button variant="outline" size="sm" className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt">
              Create Presentation
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
          <Presentation className="w-4 h-4 text-pink-400" />
          <h3 className="font-semibold text-theme-text">Recent Presentations</h3>
        </div>
        <Link to="/presentations">
          <Button variant="link" className="text-theme-accent hover:text-theme-accent/80 p-0 text-xs h-auto">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {recentPresentations.map((presentation) => (
          <div
            key={presentation.id}
            className="p-3 rounded-xl bg-theme-bg-alt hover:bg-theme-card-alt border border-transparent hover:border-pink-500/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <button 
                onClick={() => handleOpen(presentation.id)}
                className="min-w-0 flex-1 text-left"
              >
                <h4 className="font-medium text-theme-text text-sm truncate group-hover:text-pink-400 transition-colors">
                  {presentation.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-theme-text-muted">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {presentation.items.length} slides
                  </span>
                  {presentation.view_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {presentation.view_count} views
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(presentation.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </button>
              
              {/* Quick actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(presentation.id);
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(presentation.id);
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {presentations.length > limit && (
        <Link to="/presentations" className="block mt-3">
          <Button 
            variant="ghost" 
            className="w-full text-xs text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
          >
            + {presentations.length - limit} more presentations
          </Button>
        </Link>
      )}
    </div>
  );
};

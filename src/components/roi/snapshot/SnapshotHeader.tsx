import { Building2, MapPin, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SnapshotHeaderProps {
  projectName: string;
  developer: string;
  heroImageUrl?: string | null;
  floorPlanUrl?: string | null;
  brokerName?: string;
  brokerAvatarUrl?: string | null;
}

export const SnapshotHeader = ({
  projectName,
  developer,
  heroImageUrl,
  floorPlanUrl,
  brokerName,
  brokerAvatarUrl,
}: SnapshotHeaderProps) => {
  const hasBackgroundImage = !!heroImageUrl;

  return (
    <div className="relative w-full overflow-hidden rounded-lg mb-6">
      {/* Background Image or Theme-aware Gradient */}
      <div 
        className={cn(
          "absolute inset-0 bg-cover bg-center",
          !hasBackgroundImage && "bg-gradient-to-r from-theme-card via-theme-bg to-theme-card"
        )}
        style={hasBackgroundImage ? {
          backgroundImage: `url(${heroImageUrl})`,
        } : undefined}
      />
      {/* Overlay - only for images */}
      {hasBackgroundImage && <div className="absolute inset-0 bg-black/60" />}
      
      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:py-12">
        <div className="flex items-center justify-between">
          {/* Left: Broker Info */}
          <div className="flex items-center gap-3">
            {brokerAvatarUrl ? (
              <img 
                src={brokerAvatarUrl} 
                alt={brokerName || 'Broker'}
                className={cn(
                  "w-10 h-10 rounded-full border-2 object-cover",
                  hasBackgroundImage ? "border-white/30" : "border-theme-border"
                )}
              />
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                hasBackgroundImage ? "bg-white/20" : "bg-theme-card-alt"
              )}>
                <Building2 className={cn("w-5 h-5", hasBackgroundImage ? "text-white" : "text-theme-text-muted")} />
              </div>
            )}
            {brokerName && (
              <span className={cn(
                "text-sm font-medium hidden sm:block",
                hasBackgroundImage ? "text-white/80" : "text-theme-text-muted"
              )}>
                {brokerName}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {floorPlanUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      hasBackgroundImage 
                        ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                        : "bg-theme-card border-theme-border text-theme-text hover:bg-theme-card-alt"
                    )}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Floor Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogTitle>Floor Plan</DialogTitle>
                  <img 
                    src={floorPlanUrl} 
                    alt="Floor Plan" 
                    className="w-full h-auto rounded-lg"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Center: Title */}
        <div className="text-center mt-6 mb-4">
          <p className={cn(
            "text-xs uppercase tracking-wider mb-2",
            hasBackgroundImage ? "text-white/60" : "text-theme-text-muted"
          )}>
            Monthly Cashflow Statement
          </p>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-1",
            hasBackgroundImage ? "text-white" : "text-theme-text"
          )}>
            {projectName || 'Investment Property'}
          </h1>
          {developer && (
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm",
              hasBackgroundImage ? "text-white/70" : "text-theme-text-muted"
            )}>
              <MapPin className="w-4 h-4" />
              <span>by {developer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

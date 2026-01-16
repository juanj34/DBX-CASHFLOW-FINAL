import { Building2, MapPin, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      {/* Background Image or Gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: hasBackgroundImage 
            ? `url(${heroImageUrl})` 
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)',
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:py-12">
        <div className="flex items-center justify-between">
          {/* Left: Broker Info */}
          <div className="flex items-center gap-3">
            {brokerAvatarUrl ? (
              <img 
                src={brokerAvatarUrl} 
                alt={brokerName || 'Broker'}
                className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            {brokerName && (
              <span className="text-white/80 text-sm font-medium hidden sm:block">
                {brokerName}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {floorPlanUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
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
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
            Monthly Cashflow Statement
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {projectName || 'Investment Property'}
          </h1>
          {developer && (
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
              <MapPin className="w-4 h-4" />
              <span>by {developer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

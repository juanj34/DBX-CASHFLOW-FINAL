import { useState } from 'react';
import { Eye, Clock, MapPin, Calendar, Globe, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useQuoteViews, formatDuration, getCountryFlag, QuoteView } from '@/hooks/useQuoteViews';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteAnalyticsPopoverProps {
  quoteId: string;
  viewCount?: number;
  compact?: boolean;
}

const ViewHistoryItem = ({ view }: { view: QuoteView }) => {
  const date = new Date(view.started_at);
  const flag = getCountryFlag(view.country_code);
  const location = [view.city, view.country].filter(Boolean).join(', ');
  
  return (
    <div className="py-3 border-b border-theme-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-lg shrink-0">{flag}</span>
          <div className="min-w-0">
            <p className="text-sm text-theme-text truncate">
              {location || 'Unknown location'}
            </p>
            <p className="text-xs text-theme-text-muted">
              {date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })} at {date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-medium text-theme-accent">
            {formatDuration(view.duration_seconds)}
          </span>
        </div>
      </div>
    </div>
  );
};

const AnalyticsContent = ({ 
  analytics, 
  loading 
}: { 
  analytics: ReturnType<typeof useQuoteViews>['analytics'];
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!analytics || analytics.totalViews === 0) {
    return (
      <div className="p-6 text-center">
        <Eye className="w-10 h-10 text-theme-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm text-theme-text-muted">No views yet</p>
        <p className="text-xs text-theme-text-muted mt-1">Share this quote to start tracking</p>
      </div>
    );
  }

  const uniqueLocations = new Set(
    analytics.views
      .filter(v => v.country_code)
      .map(v => v.country_code)
  ).size;

  return (
    <div className="divide-y divide-theme-border">
      {/* Summary Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-theme-bg-alt">
            <Eye className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-theme-text">{analytics.totalViews}</p>
            <p className="text-xs text-theme-text-muted">Views</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-theme-bg-alt">
            <Clock className="w-4 h-4 text-theme-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-theme-text">{formatDuration(analytics.totalTimeSpent)}</p>
            <p className="text-xs text-theme-text-muted">Total time</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-theme-bg-alt">
            <Globe className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-theme-text">{uniqueLocations}</p>
            <p className="text-xs text-theme-text-muted">Locations</p>
          </div>
        </div>

        {/* Avg time per view */}
        {analytics.averageDuration && (
          <div className="mt-3 flex items-center justify-between text-xs text-theme-text-muted">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg. per view
            </span>
            <span className="text-theme-text">{formatDuration(analytics.averageDuration)}</span>
          </div>
        )}
      </div>

      {/* View History */}
      <div className="p-4 pt-3">
        <h4 className="text-xs font-medium text-theme-text-muted uppercase tracking-wide mb-2">
          View History
        </h4>
        <ScrollArea className="h-[200px]">
          <div className="space-y-0">
            {analytics.views.slice(0, 10).map((view) => (
              <ViewHistoryItem key={view.id} view={view} />
            ))}
          </div>
          {analytics.views.length > 10 && (
            <p className="text-xs text-theme-text-muted text-center mt-2">
              + {analytics.views.length - 10} more views
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export const QuoteAnalyticsPopover = ({
  quoteId,
  viewCount = 0,
  compact = false,
}: QuoteAnalyticsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { analytics, loading } = useQuoteViews(open ? quoteId : undefined);
  const isMobile = useIsMobile();

  const trigger = compact ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-theme-text-muted hover:text-cyan-400 hover:bg-cyan-500/10"
    >
      <Eye className="w-4 h-4" />
    </Button>
  ) : (
    <Button
      variant="ghost"
      className="h-8 px-2 text-theme-text-muted hover:text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
    >
      <Eye className="w-4 h-4" />
      <span className="text-sm">{viewCount}</span>
    </Button>
  );

  // Use Sheet for mobile, Popover for desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-theme-card border-theme-border rounded-t-2xl h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-theme-text flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Quote Analytics
            </SheetTitle>
          </SheetHeader>
          <AnalyticsContent analytics={analytics} loading={loading} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-theme-card border-theme-border" 
        align="end"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-theme-border">
          <h3 className="font-semibold text-theme-text flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Quote Analytics
          </h3>
        </div>
        <AnalyticsContent analytics={analytics} loading={loading} />
      </PopoverContent>
    </Popover>
  );
};

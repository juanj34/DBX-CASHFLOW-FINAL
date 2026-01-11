import { Eye, Clock, Users, MapPin, TrendingUp, Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePresentationAnalytics } from "@/hooks/usePresentationAnalytics";
import { formatDistanceToNow } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface PresentationAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  presentationId: string;
  presentationTitle: string;
}

// Format seconds to human-readable duration
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// Get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Fill missing days in chart data
const fillMissingDays = (data: { date: string; views: number; uniqueSessions: number }[]) => {
  if (data.length === 0) return [];

  const result: { date: string; views: number; uniqueSessions: number }[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);

  const dataMap = new Map(data.map((d) => [d.date, d]));

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    result.push(dataMap.get(dateStr) || { date: dateStr, views: 0, uniqueSessions: 0 });
  }

  return result;
};

export const PresentationAnalyticsModal = ({
  open,
  onClose,
  presentationId,
  presentationTitle,
}: PresentationAnalyticsModalProps) => {
  const { analytics, loading } = usePresentationAnalytics(presentationId);

  const chartData = analytics ? fillMissingDays(analytics.viewsByDay) : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-theme-accent" />
            Presentation Analytics
          </DialogTitle>
          <p className="text-sm text-theme-text-muted mt-1 truncate">
            {presentationTitle}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
          </div>
        ) : !analytics || analytics.totalViews === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-theme-text-muted">
            <Eye className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No views yet</p>
            <p className="text-sm mt-1">Share your presentation to start tracking analytics</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={analytics.totalViews.toString()}
                  iconColor="text-theme-accent"
                />
                <StatCard
                  icon={Users}
                  label="Unique Viewers"
                  value={analytics.uniqueViewers.toString()}
                  iconColor="text-purple-400"
                />
                <StatCard
                  icon={Clock}
                  label="Avg. Duration"
                  value={formatDuration(analytics.avgEngagementTime)}
                  iconColor="text-cyan-400"
                />
                <StatCard
                  icon={Clock}
                  label="Total Time"
                  value={formatDuration(analytics.totalEngagementTime)}
                  iconColor="text-emerald-400"
                />
              </div>

              {/* Views Over Time Chart */}
              <div className="bg-theme-bg rounded-xl p-4 border border-theme-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-theme-accent" />
                  <h3 className="text-sm font-medium text-theme-text">Views Over Time</h3>
                  <Badge variant="outline" className="text-xs border-theme-border text-theme-text-muted">
                    Last 30 days
                  </Badge>
                </div>
                
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="analyticsColorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--theme-accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--theme-accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--theme-border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--theme-text-muted))"
                        fontSize={10}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis stroke="hsl(var(--theme-text-muted))" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--theme-card))",
                          border: "1px solid hsl(var(--theme-border))",
                          borderRadius: "8px",
                          color: "hsl(var(--theme-text))",
                          fontSize: "12px",
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--theme-accent))"
                        strokeWidth={2}
                        fill="url(#analyticsColorViews)"
                        name="Views"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Location Breakdown & Recent Views */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Location Breakdown */}
                <div className="bg-theme-bg rounded-xl p-4 border border-theme-border">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-medium text-theme-text">Viewer Locations</h3>
                  </div>
                  
                  {analytics.locationBreakdown.length === 0 ? (
                    <p className="text-sm text-theme-text-muted py-4 text-center">
                      No location data available
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {analytics.locationBreakdown.map((location) => {
                        const percentage = Math.round((location.count / analytics.totalViews) * 100);
                        return (
                          <div key={location.country} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{getCountryFlag(location.countryCode)}</span>
                                <span className="text-sm text-theme-text">{location.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-theme-text">{location.count}</span>
                                <span className="text-xs text-theme-text-muted">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-theme-card rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500/60 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {location.cities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {location.cities.slice(0, 3).map((city) => (
                                  <span
                                    key={city.city}
                                    className="text-[10px] px-1.5 py-0.5 bg-theme-card rounded text-theme-text-muted"
                                  >
                                    {city.city} ({city.count})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Views */}
                <div className="bg-theme-bg rounded-xl p-4 border border-theme-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-medium text-theme-text">Recent Views</h3>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {analytics.recentViews.map((view) => (
                      <div
                        key={view.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-theme-card/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getCountryFlag(view.country || '')}</span>
                          <div>
                            <p className="text-xs text-theme-text">
                              {view.city || view.country || 'Unknown location'}
                            </p>
                            <p className="text-[10px] text-theme-text-muted">
                              {formatDistanceToNow(new Date(view.startedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {view.duration !== null && (
                          <Badge variant="outline" className="text-[10px] border-theme-border text-theme-text-muted">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatDuration(view.duration)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  iconColor: string;
}) => (
  <div className="bg-theme-bg rounded-xl p-3 border border-theme-border">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={cn("w-4 h-4", iconColor)} />
      <span className="text-xs text-theme-text-muted">{label}</span>
    </div>
    <p className="text-lg font-bold text-theme-text">{value}</p>
  </div>
);

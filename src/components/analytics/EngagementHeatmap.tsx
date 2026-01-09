import { Clock } from "lucide-react";

interface ViewByHour {
  hour: number;
  views: number;
}

interface ViewByDayOfWeek {
  day: number;
  dayName: string;
  views: number;
}

interface EngagementHeatmapProps {
  viewsByHour: ViewByHour[];
  viewsByDayOfWeek: ViewByDayOfWeek[];
}

export const EngagementHeatmap = ({ viewsByHour, viewsByDayOfWeek }: EngagementHeatmapProps) => {
  const maxHourViews = Math.max(...viewsByHour.map((h) => h.views), 1);
  const maxDayViews = Math.max(...viewsByDayOfWeek.map((d) => d.views), 1);

  const getIntensity = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio === 0) return "bg-theme-bg-alt";
    if (ratio < 0.25) return "bg-cyan-500/20";
    if (ratio < 0.5) return "bg-cyan-500/40";
    if (ratio < 0.75) return "bg-cyan-500/60";
    return "bg-cyan-500/80";
  };

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-theme-text">Engagement Patterns</h3>
      </div>

      <div className="space-y-6">
        {/* By Hour */}
        <div>
          <p className="text-sm text-theme-text-muted mb-3">Views by Hour (24h)</p>
          <div className="flex gap-1 flex-wrap">
            {viewsByHour.map((h) => (
              <div
                key={h.hour}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${getIntensity(h.views, maxHourViews)} text-theme-text`}
                title={`${h.hour}:00 - ${h.views} views`}
              >
                {h.hour}
              </div>
            ))}
          </div>
        </div>

        {/* By Day of Week */}
        <div>
          <p className="text-sm text-theme-text-muted mb-3">Views by Day</p>
          <div className="flex gap-2">
            {viewsByDayOfWeek.map((d) => (
              <div key={d.day} className="flex-1 text-center">
                <div
                  className={`h-10 rounded-lg ${getIntensity(d.views, maxDayViews)} flex items-center justify-center`}
                  title={`${d.dayName} - ${d.views} views`}
                >
                  <span className="text-sm font-medium text-theme-text">{d.views}</span>
                </div>
                <p className="text-xs text-theme-text-muted mt-1">{d.dayName.slice(0, 3)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

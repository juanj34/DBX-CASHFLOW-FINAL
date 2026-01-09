import { MapPin } from "lucide-react";

interface LocationData {
  country: string;
  countryCode: string;
  count: number;
  cities: { city: string; count: number }[];
}

interface LocationBreakdownProps {
  data: LocationData[];
}

export const LocationBreakdown = ({ data }: LocationBreakdownProps) => {
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const totalViews = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-theme-text">Viewer Locations</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-theme-text-muted">
          No location data yet
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {data.map((location) => {
            const percentage = totalViews > 0 ? Math.round((location.count / totalViews) * 100) : 0;

            return (
              <div key={location.country} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(location.countryCode)}</span>
                    <span className="text-sm text-theme-text">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-theme-text">{location.count}</span>
                    <span className="text-xs text-theme-text-muted">({percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-theme-bg-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/60 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Top cities */}
                {location.cities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {location.cities.slice(0, 3).map((city) => (
                      <span
                        key={city.city}
                        className="text-xs px-2 py-0.5 bg-theme-bg-alt rounded-full text-theme-text-muted"
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
  );
};

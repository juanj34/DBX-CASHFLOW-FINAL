import { TrendingUp } from "lucide-react";

interface ConversionFunnelData {
  total: number;
  viewed: number;
  presented: number;
  negotiating: number;
  sold: number;
}

interface ConversionFunnelProps {
  data: ConversionFunnelData;
}

export const ConversionFunnel = ({ data }: ConversionFunnelProps) => {
  const stages = [
    { label: "Total Quotes", value: data.total, color: "bg-gray-500" },
    { label: "Viewed", value: data.viewed, color: "bg-cyan-500" },
    { label: "Presented", value: data.presented, color: "bg-blue-500" },
    { label: "Negotiating", value: data.negotiating, color: "bg-orange-500" },
    { label: "Sold", value: data.sold, color: "bg-green-500" },
  ];

  const maxValue = Math.max(data.total, 1);

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-theme-text">Conversion Funnel</h3>
      </div>

      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const widthPercent = (stage.value / maxValue) * 100;
          const prevValue = idx > 0 ? stages[idx - 1].value : null;
          const conversionRate = prevValue && prevValue > 0
            ? Math.round((stage.value / prevValue) * 100)
            : null;

          return (
            <div key={stage.label} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-text">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-theme-text">{stage.value}</span>
                  {conversionRate !== null && (
                    <span className="text-xs text-theme-text-muted">({conversionRate}%)</span>
                  )}
                </div>
              </div>
              <div className="h-8 bg-theme-bg-alt rounded-lg overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all duration-500 rounded-lg flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  {widthPercent > 20 && (
                    <span className="text-xs font-medium text-white">
                      {Math.round(widthPercent)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Conversion Rate */}
      <div className="mt-4 pt-4 border-t border-theme-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-theme-text-muted">Overall Conversion Rate</span>
          <span className="text-lg font-bold text-green-400">
            {data.total > 0 ? Math.round((data.sold / data.total) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

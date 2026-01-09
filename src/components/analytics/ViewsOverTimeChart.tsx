import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ViewByDay {
  date: string;
  views: number;
  uniqueSessions: number;
}

interface ViewsOverTimeChartProps {
  data: ViewByDay[];
}

export const ViewsOverTimeChart = ({ data }: ViewsOverTimeChartProps) => {
  // Fill in missing days with 0 views
  const filledData = fillMissingDays(data);

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-theme-accent" />
        <h3 className="text-lg font-semibold text-theme-text">Views Over Time</h3>
      </div>

      {filledData.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-theme-text-muted">
          No view data yet
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filledData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--theme-accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--theme-accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--theme-border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--theme-text-muted))"
                fontSize={11}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="hsl(var(--theme-text-muted))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--theme-card))",
                  border: "1px solid hsl(var(--theme-border))",
                  borderRadius: "8px",
                  color: "hsl(var(--theme-text))",
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--theme-accent))"
                strokeWidth={2}
                fill="url(#colorViews)"
                name="Views"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

function fillMissingDays(data: ViewByDay[]): ViewByDay[] {
  if (data.length === 0) return [];

  const result: ViewByDay[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);

  const dataMap = new Map(data.map((d) => [d.date, d]));

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    result.push(dataMap.get(dateStr) || { date: dateStr, views: 0, uniqueSessions: 0 });
  }

  return result;
}

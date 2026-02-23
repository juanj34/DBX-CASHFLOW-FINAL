import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { OIInputs, OICalculations, monthName } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface CapitalTimelineTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

export const CapitalTimelineTab = ({ inputs, calculations, currency, rate }: CapitalTimelineTabProps) => {
  const { yearlyProjections, basePrice, totalEntryCosts, dldFeeAmount, totalMonths } = calculations;
  const totalCapitalInvested = basePrice + totalEntryCosts;

  // Handover year index for reference line
  const handoverYearIndex = inputs.handoverYear - inputs.bookingYear + 1;

  // Build chart data from yearly projections
  const chartData = useMemo(() => {
    let cumulativePayments = inputs.eoiFee + dldFeeAmount + inputs.oqoodFee; // Entry costs at booking
    let cumulativeRent = 0;

    return yearlyProjections.map((proj, idx) => {
      // Accumulate payments made during construction
      if (proj.isConstruction || proj.isHandover) {
        const yearFraction = proj.isHandover ? 0.5 : 1;
        cumulativePayments += (basePrice * (inputs.preHandoverPercent / 100) / Math.max(1, handoverYearIndex - 1)) * yearFraction;
      }

      // Accumulate rental income post-handover
      if (proj.netRent && proj.netRent > 0) {
        cumulativeRent += proj.netRent;
      }

      return {
        year: `Y${idx + 1}`,
        yearLabel: proj.year,
        propertyValue: Math.round(proj.propertyValue),
        capitalDeployed: Math.round(Math.min(cumulativePayments, totalCapitalInvested)),
        cumulativeRent: Math.round(cumulativeRent),
        phase: proj.phase,
      };
    });
  }, [yearlyProjections, basePrice, totalEntryCosts, dldFeeAmount, handoverYearIndex, inputs, totalCapitalInvested]);

  const lastProjection = yearlyProjections[yearlyProjections.length - 1];
  const totalAppreciation = lastProjection ? lastProjection.propertyValue - basePrice : 0;
  const totalRentCollected = yearlyProjections.reduce((sum, p) => sum + (p.netRent || 0), 0);

  const formatValue = (value: number) => formatCurrency(value, currency, rate);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Invested" value={formatValue(totalCapitalInvested)} color="text-theme-accent" />
        <MetricCard label="Current Value (Y10)" value={formatValue(lastProjection?.propertyValue || basePrice)} color="text-green-400" />
        <MetricCard label="Unrealized Gain" value={formatValue(totalAppreciation)} color="text-emerald-400" />
        <MetricCard label="Total Rent (10yr)" value={formatValue(totalRentCollected)} color="text-cyan-400" />
      </div>

      {/* Entry Costs Breakdown */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <h4 className="text-sm font-semibold text-theme-text mb-3">Entry Costs Breakdown</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-theme-text-muted">DLD (4%)</div>
            <div className="text-sm font-mono text-theme-accent">{formatValue(dldFeeAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-theme-text-muted">Oqood</div>
            <div className="text-sm font-mono text-theme-accent">{formatValue(inputs.oqoodFee)}</div>
          </div>
          <div>
            <div className="text-xs text-theme-text-muted">EOI</div>
            <div className="text-sm font-mono text-theme-accent">{formatValue(inputs.eoiFee)}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <h4 className="text-sm font-semibold text-theme-text mb-4">10-Year Capital Timeline</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <RechartsTooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [formatValue(value), name]}
              />
              <ReferenceLine
                x={`Y${handoverYearIndex}`}
                stroke="#22c55e"
                strokeDasharray="5 5"
                label={{ value: 'Handover', fill: '#22c55e', fontSize: 11 }}
              />
              <Area type="monotone" dataKey="propertyValue" name="Property Value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
              <Area type="monotone" dataKey="capitalDeployed" name="Capital Deployed" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
              <Area type="monotone" dataKey="cumulativeRent" name="Cumulative Rent" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <LegendItem color="#22c55e" label="Property Value" />
          <LegendItem color="#f59e0b" label="Capital Deployed" />
          <LegendItem color="#06b6d4" label="Cumulative Rent" />
        </div>
      </div>

      {/* Handover Info */}
      <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
        <span className="text-xs text-green-400">
          Handover: {monthName(inputs.handoverMonth)} {inputs.handoverYear} ({totalMonths} months from booking)
        </span>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
    <div className="text-[10px] text-theme-text-muted uppercase tracking-wide">{label}</div>
    <div className={`text-sm font-mono font-semibold mt-1 ${color}`}>{value}</div>
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-theme-text-muted">{label}</span>
  </div>
);

import { Rocket, Shield, Home, TrendingUp, TrendingDown, Wallet, BadgePercent } from "lucide-react";
import { InvestorMetrics } from "./useROICalculations";
import { Currency, formatCurrency } from "./currencyUtils";

type InvestorType = 'oi' | 'si' | 'ho';

interface InvestorCardProps {
  type: InvestorType;
  metrics: InvestorMetrics;
  currency: Currency;
}

const config = {
  oi: {
    title: 'Opportunity Investor',
    subtitle: 'Early Bird Advantage',
    icon: Rocket,
    color: '#CCFF00',
    bgGradient: 'from-[#CCFF00]/10 to-transparent',
    borderColor: 'border-[#CCFF00]/30',
  },
  si: {
    title: 'Security Investor',
    subtitle: 'Stable Returns',
    icon: Shield,
    color: '#00EAFF',
    bgGradient: 'from-[#00EAFF]/10 to-transparent',
    borderColor: 'border-[#00EAFF]/30',
  },
  ho: {
    title: 'Home Owner',
    subtitle: 'End User Value',
    icon: Home,
    color: '#FF00FF',
    bgGradient: 'from-[#FF00FF]/10 to-transparent',
    borderColor: 'border-[#FF00FF]/30',
  },
};

export const InvestorCard = ({ type, metrics, currency }: InvestorCardProps) => {
  const { title, subtitle, icon: Icon, color, bgGradient, borderColor } = config[type];
  const isHO = type === 'ho';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} bg-theme-card border ${borderColor} p-5`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
          </div>
          <p className="text-sm text-theme-text-muted">{subtitle}</p>
        </div>
        {!isHO && (
          <div 
            className="text-2xl font-bold font-mono"
            style={{ color }}
          >
            {metrics.roe.toFixed(1)}%
            <span className="text-xs text-theme-text-muted block text-right">ROE</span>
          </div>
        )}
        {isHO && (
          <div 
            className="text-2xl font-bold font-mono"
            style={{ color }}
          >
            {metrics.rentalYield.toFixed(1)}%
            <span className="text-xs text-theme-text-muted block text-right">Yield</span>
          </div>
        )}
      </div>

      {/* Main Metrics - Entry/Exit/Profit */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-theme-text-muted text-xs">
            <TrendingDown className="w-3.5 h-3.5" />
            Entry Price
          </div>
          <p className="text-white font-semibold font-mono text-sm">{formatCurrency(metrics.entryPrice, currency)}</p>
        </div>

        {!isHO && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-theme-text-muted text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Exit Price
            </div>
            <p className="text-white font-semibold font-mono text-sm">{formatCurrency(metrics.exitPrice, currency)}</p>
          </div>
        )}

        {!isHO && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-theme-text-muted text-xs">
              <BadgePercent className="w-3.5 h-3.5" />
              Profit
            </div>
            <p className="font-semibold font-mono text-sm" style={{ color: metrics.projectedProfit > 0 ? color : '#6b7280' }}>
              {metrics.projectedProfit > 0 ? '+' : ''}{formatCurrency(metrics.projectedProfit, currency)}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-theme-text-muted text-xs">
            <Wallet className="w-3.5 h-3.5" />
            Equity Deployed
          </div>
          <p className="text-white font-semibold font-mono text-sm">{formatCurrency(metrics.equityInvested, currency)}</p>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="pt-3 border-t border-theme-border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-theme-text-muted">Rental Yield</span>
          <span className="font-mono font-semibold text-sm" style={{ color }}>{metrics.rentalYield.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-theme-text-muted">Years to Pay</span>
          <span className="font-mono font-semibold text-sm" style={{ color }}>{metrics.yearsToPay.toFixed(1)} yrs</span>
        </div>
      </div>

      {/* Decorative glow */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

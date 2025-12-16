import { Rocket, Shield, Home, TrendingUp, Wallet, BadgePercent } from "lucide-react";
import { InvestorMetrics } from "./useROICalculations";

type InvestorType = 'oi' | 'si' | 'ho';

interface InvestorCardProps {
  type: InvestorType;
  metrics: InvestorMetrics;
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

const formatAED = (value: number) => {
  return new Intl.NumberFormat('en-AE', { 
    style: 'currency', 
    currency: 'AED',
    maximumFractionDigits: 0 
  }).format(value);
};

export const InvestorCard = ({ type, metrics }: InvestorCardProps) => {
  const { title, subtitle, icon: Icon, color, bgGradient, borderColor } = config[type];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} bg-[#1a1f2e] border ${borderColor} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <div 
          className="text-2xl font-bold font-mono"
          style={{ color }}
        >
          {metrics.roe.toFixed(1)}%
          <span className="text-xs text-gray-400 block text-right">ROE</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            Property Value
          </div>
          <p className="text-white font-semibold font-mono">{formatAED(metrics.propertyValue)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            Equity Deployed
          </div>
          <p className="text-white font-semibold font-mono">{formatAED(metrics.equityInvested)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <BadgePercent className="w-3.5 h-3.5" />
            Projected Profit
          </div>
          <p className="font-semibold font-mono" style={{ color: metrics.projectedProfit > 0 ? color : '#6b7280' }}>
            {metrics.projectedProfit > 0 ? '+' : ''}{formatAED(metrics.projectedProfit)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Home className="w-3.5 h-3.5" />
            Rental Yield
          </div>
          <p className="text-white font-semibold font-mono">{metrics.rentalYield.toFixed(2)}%</p>
        </div>
      </div>

      {/* Bottom stat */}
      <div className="mt-4 pt-4 border-t border-[#2a3142]">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Years to Pay Price</span>
          <span className="font-mono font-semibold" style={{ color }}>{metrics.yearsToPay.toFixed(1)} yrs</span>
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

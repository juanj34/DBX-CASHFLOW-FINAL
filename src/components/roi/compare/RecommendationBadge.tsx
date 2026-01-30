import { Trophy, TrendingUp, Shield, Wallet } from 'lucide-react';
import { InvestmentFocus, QuoteRecommendation } from '@/hooks/useRecommendationEngine';

interface RecommendationBadgeProps {
  recommendation: QuoteRecommendation;
  focus: InvestmentFocus | null;
  color: string;
}

export const RecommendationBadge = ({ recommendation, focus, color }: RecommendationBadgeProps) => {
  const { scores, winner } = recommendation;

  // If no focus selected, show all badges the quote wins
  const showRoiBadge = focus === null ? winner.roi : focus === 'roi' && winner.roi;
  const showSafetyBadge = focus === null ? winner.safety : focus === 'safety' && winner.safety;
  const showCashflowBadge = focus === null ? winner.cashflow : focus === 'cashflow' && winner.cashflow;

  const hasBadge = showRoiBadge || showSafetyBadge || showCashflowBadge;

  if (!hasBadge) return null;

  return (
    <div className="space-y-1">
      {showRoiBadge && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Trophy className="w-3 h-3" />
          Best for ROI
        </div>
      )}
      {showSafetyBadge && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
          <Shield className="w-3 h-3" />
          Safest Option
        </div>
      )}
      {showCashflowBadge && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
          <Wallet className="w-3 h-3" />
          Best Cash Flow
        </div>
      )}
    </div>
  );
};

interface ScoreDisplayProps {
  scores: QuoteRecommendation['scores'];
  focus: InvestmentFocus | null;
}

export const ScoreDisplay = ({ scores, focus }: ScoreDisplayProps) => {
  const items = [
    { id: 'roi' as const, label: 'ROI', score: scores.roi, icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'safety' as const, label: 'Safety', score: scores.safety, icon: Shield, color: 'text-blue-400' },
    { id: 'cashflow' as const, label: 'Income', score: scores.cashflow, icon: Wallet, color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {items.map(({ id, label, score, icon: Icon, color }) => {
        const isHighlighted = focus === id;
        return (
          <div 
            key={id}
            className={`text-center p-2 rounded-lg ${
              isHighlighted ? 'bg-theme-accent/10 ring-1 ring-theme-accent/30' : 'bg-theme-bg-alt'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${color}`} />
            <div className={`text-sm font-bold ${isHighlighted ? 'text-theme-accent' : 'text-theme-text'}`}>
              {score}
            </div>
            <div className="text-[10px] text-theme-text-muted">{label}</div>
          </div>
        );
      })}
    </div>
  );
};

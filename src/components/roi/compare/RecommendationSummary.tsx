import { Lightbulb, TrendingUp, Shield, Wallet } from 'lucide-react';
import { InvestmentFocus, RecommendationResult } from '@/hooks/useRecommendationEngine';

interface RecommendationSummaryProps {
  result: RecommendationResult;
  focus: InvestmentFocus | null;
}

export const RecommendationSummary = ({ result, focus }: RecommendationSummaryProps) => {
  const getIcon = (f: InvestmentFocus) => {
    switch (f) {
      case 'roi': return TrendingUp;
      case 'safety': return Shield;
      case 'cashflow': return Wallet;
    }
  };

  const getColor = (f: InvestmentFocus) => {
    switch (f) {
      case 'roi': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'safety': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'cashflow': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const getTitle = (f: InvestmentFocus) => {
    switch (f) {
      case 'roi': return 'Best for ROI Seekers';
      case 'safety': return 'Best for Capital Protection';
      case 'cashflow': return 'Best for Passive Income';
    }
  };

  if (focus) {
    const Icon = getIcon(focus);
    const colorClass = getColor(focus);
    const explanation = result.explanation[focus];

    return (
      <div className={`border rounded-xl p-4 ${colorClass}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/20">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{getTitle(focus)}</h4>
            <p className="text-sm mt-1 opacity-90">{explanation}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show all insights when no focus selected
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-[#CCFF00]" />
        <h4 className="font-medium text-white">AI Insights</h4>
      </div>
      <p className="text-sm text-gray-400 mb-3">
        Select an investment focus above to see personalized recommendations, or review the scores below.
      </p>
      <div className="grid gap-2 text-xs">
        {(['roi', 'safety', 'cashflow'] as InvestmentFocus[]).map((f) => {
          const Icon = getIcon(f);
          return (
            <div key={f} className="flex items-start gap-2 text-gray-300">
              <Icon className="w-3.5 h-3.5 mt-0.5 text-theme-text-muted" />
              <span>{result.explanation[f]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { TrendingUp, Shield, Wallet } from 'lucide-react';
import { InvestmentFocus } from '@/hooks/useRecommendationEngine';

interface ProfileSelectorProps {
  selected: InvestmentFocus | null;
  onSelect: (focus: InvestmentFocus | null) => void;
}

export const ProfileSelector = ({ selected, onSelect }: ProfileSelectorProps) => {
  const profiles: { id: InvestmentFocus; label: string; icon: typeof TrendingUp; description: string }[] = [
    { 
      id: 'roi', 
      label: 'ROI Focus', 
      icon: TrendingUp, 
      description: 'Maximize capital gains' 
    },
    { 
      id: 'safety', 
      label: 'Safety Focus', 
      icon: Shield, 
      description: 'Prioritize stability' 
    },
    { 
      id: 'cashflow', 
      label: 'Cash Flow', 
      icon: Wallet, 
      description: 'Optimize rental income' 
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {profiles.map(({ id, label, icon: Icon, description }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(isSelected ? null : id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isSelected
                ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]'
                : 'bg-[#0f172a] border-[#2a3142] text-gray-400 hover:border-[#CCFF00]/50 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <div className="text-left">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs opacity-70">{description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

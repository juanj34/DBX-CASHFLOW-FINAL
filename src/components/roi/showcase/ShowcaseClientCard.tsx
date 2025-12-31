import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShowcaseClientCardProps {
  clientName: string;
  clientCountry: string;
  className?: string;
}

// Country code to flag emoji mapping
const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦', 'KSA': '🇸🇦',
    'United States': '🇺🇸', 'USA': '🇺🇸',
    'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
    'India': '🇮🇳', 'Pakistan': '🇵🇰', 'China': '🇨🇳', 'Russia': '🇷🇺',
    'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
    'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Singapore': '🇸🇬',
    'Egypt': '🇪🇬', 'Jordan': '🇯🇴', 'Lebanon': '🇱🇧',
    'Kuwait': '🇰🇼', 'Qatar': '🇶🇦', 'Bahrain': '🇧🇭', 'Oman': '🇴🇲',
    'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Turkey': '🇹🇷',
    'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Morocco': '🇲🇦',
    'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭',
    'Austria': '🇦🇹', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
    'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
    'Greece': '🇬🇷', 'Portugal': '🇵🇹', 'Ireland': '🇮🇪',
    'New Zealand': '🇳🇿', 'Malaysia': '🇲🇾', 'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳', 'Indonesia': '🇮🇩', 'Philippines': '🇵🇭',
    'Hong Kong': '🇭🇰', 'Taiwan': '🇹🇼', 'Argentina': '🇦🇷',
    'Chile': '🇨🇱', 'Colombia': '🇨🇴', 'Peru': '🇵🇪', 'Venezuela': '🇻🇪',
  };
  return flags[country] || '🌍';
};

export const ShowcaseClientCard: React.FC<ShowcaseClientCardProps> = ({
  clientName,
  clientCountry,
  className,
}) => {
  const flag = getCountryFlag(clientCountry);

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Client</p>
          <p className="text-sm font-semibold text-white truncate">{clientName || 'Client'}</p>
        </div>
        {clientCountry && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 rounded-md">
            <span className="text-base">{flag}</span>
            <span className="text-[10px] text-slate-300 hidden sm:inline max-w-[80px] truncate">{clientCountry}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseClientCard;

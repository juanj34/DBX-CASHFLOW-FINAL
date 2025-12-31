import React from 'react';
import { User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShowcaseClientCardProps {
  clientName: string;
  clientCountry: string;
  className?: string;
}

// Country code to flag emoji mapping
const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'United Arab Emirates': '🇦🇪',
    'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'United States': '🇺🇸',
    'USA': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'UK': '🇬🇧',
    'India': '🇮🇳',
    'Pakistan': '🇵🇰',
    'China': '🇨🇳',
    'Russia': '🇷🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'Singapore': '🇸🇬',
    'Egypt': '🇪🇬',
    'Jordan': '🇯🇴',
    'Lebanon': '🇱🇧',
    'Kuwait': '🇰🇼',
    'Qatar': '🇶🇦',
    'Bahrain': '🇧🇭',
    'Oman': '🇴🇲',
    'Nigeria': '🇳🇬',
    'South Africa': '🇿🇦',
    'Turkey': '🇹🇷',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Morocco': '🇲🇦',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Poland': '🇵🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Greece': '🇬🇷',
    'Portugal': '🇵🇹',
    'Ireland': '🇮🇪',
    'New Zealand': '🇳🇿',
    'Malaysia': '🇲🇾',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Hong Kong': '🇭🇰',
    'Taiwan': '🇹🇼',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Peru': '🇵🇪',
    'Venezuela': '🇻🇪',
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
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Subtle glow accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30">
          <User className="w-5 h-5 text-cyan-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Your Investment</p>
          <p className="text-lg font-semibold text-white truncate">{clientName || 'Client'}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-slate-300">
        <span className="text-xl">{flag}</span>
        <span className="text-sm">{clientCountry || 'International'}</span>
      </div>
    </div>
  );
};

export default ShowcaseClientCard;

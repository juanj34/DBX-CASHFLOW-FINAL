import React from 'react';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  country?: string;
}

interface ShowcaseClientCardProps {
  clients?: Client[];
  // Legacy single client support
  clientName?: string;
  clientCountry?: string;
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
  clients,
  clientName,
  clientCountry,
  className,
}) => {
  // Support both array and legacy single client
  const clientList = clients?.length 
    ? clients 
    : clientName 
      ? [{ id: '1', name: clientName, country: clientCountry }] 
      : [];

  const hasMultiple = clientList.length > 1;

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          {hasMultiple ? <Users className="w-4 h-4 text-cyan-400" /> : <User className="w-4 h-4 text-cyan-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
            {hasMultiple ? `Clients (${clientList.length})` : 'Client'}
          </p>
        </div>
      </div>

      {/* Client Grid */}
      <div className={cn(
        "grid gap-1.5",
        clientList.length === 1 ? "grid-cols-1" : "grid-cols-2"
      )}>
        {clientList.map((client) => (
          <div 
            key={client.id} 
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/30 rounded-md"
          >
            {client.country && (
              <span className="text-sm">{getCountryFlag(client.country)}</span>
            )}
            <span className="text-xs font-medium text-white truncate flex-1">{client.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowcaseClientCard;

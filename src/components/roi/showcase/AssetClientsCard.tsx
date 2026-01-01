import React from 'react';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  country?: string;
}

interface AssetClientsCardProps {
  clients?: Client[];
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

export const AssetClientsCard: React.FC<AssetClientsCardProps> = ({
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

  if (clientList.length === 0) return null;

  const hasMultiple = clientList.length > 1;

  return (
    <div className={cn(
      "bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-5",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          {hasMultiple ? <Users className="w-5 h-5 text-cyan-400" /> : <User className="w-5 h-5 text-cyan-400" />}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {hasMultiple ? 'Clients' : 'Client'}
          </p>
          {hasMultiple && (
            <p className="text-sm font-medium text-white">{clientList.length} buyers</p>
          )}
        </div>
      </div>

      {/* Client Grid */}
      <div className={cn(
        "grid gap-2",
        clientList.length === 1 ? "grid-cols-1" : 
        clientList.length === 2 ? "grid-cols-2" : 
        "grid-cols-2 lg:grid-cols-3"
      )}>
        {clientList.map((client) => (
          <div 
            key={client.id} 
            className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5"
          >
            {client.country && (
              <span className="text-lg">{getCountryFlag(client.country)}</span>
            )}
            <span className="text-sm font-medium text-white truncate flex-1">{client.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetClientsCard;

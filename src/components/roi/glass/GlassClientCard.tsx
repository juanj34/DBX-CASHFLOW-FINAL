import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface Client {
  id?: string;
  name: string;
  country?: string;
}

interface GlassClientCardProps {
  clients: Client[];
}

const getCountryFlag = (country?: string): string => {
  if (!country) return '🌍';
  const flags: Record<string, string> = {
    'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦', 'KSA': '🇸🇦',
    'United States': '🇺🇸', 'USA': '🇺🇸',
    'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
    'India': '🇮🇳', 'Pakistan': '🇵🇰', 'China': '🇨🇳', 'Russia': '🇷🇺',
    'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Colombia': '🇨🇴', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷',
  };
  return flags[country] || '🌍';
};

export const GlassClientCard = ({ clients }: GlassClientCardProps) => {
  return (
    <motion.div
      className="glass-card rounded-2xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">
            {clients.length === 1 ? 'Client' : 'Clients'}
          </p>
          {clients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {clients.map((client, i) => (
                <span 
                  key={client.id || i}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 glass-card-inset rounded-full text-sm text-white/90"
                >
                  <span>{getCountryFlag(client.country)}</span>
                  <span className="font-medium">{client.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-white/70">TBD</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

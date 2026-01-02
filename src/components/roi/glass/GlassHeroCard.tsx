import { motion } from "framer-motion";
import { Building2, MapPin, Calendar } from "lucide-react";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { cn } from "@/lib/utils";

interface GlassHeroCardProps {
  price: number;
  currency: Currency;
  rate: number;
  pricePerSqft?: number | null;
  projectName?: string;
  zoneName?: string;
  developerName?: string;
  unitType?: string;
  handoverQuarter?: number;
  handoverYear?: number;
  marketDiffPercent?: number | null;
  onDeveloperClick?: () => void;
}

export const GlassHeroCard = ({
  price,
  currency,
  rate,
  pricePerSqft,
  projectName,
  zoneName,
  developerName,
  unitType,
  handoverQuarter,
  handoverYear,
  marketDiffPercent,
  onDeveloperClick,
}: GlassHeroCardProps) => {
  return (
    <motion.div
      className="relative glass-card-elevated rounded-3xl p-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow effect behind */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-theme-accent/20 blur-[100px] -z-10" />
      
      {/* Building icon decoration */}
      <div className="absolute top-4 right-4 opacity-10">
        <Building2 className="w-24 h-24 text-white" />
      </div>

      {/* Unit type badge */}
      {unitType && (
        <motion.div 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-full mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm font-semibold text-theme-accent">{unitType}</span>
        </motion.div>
      )}

      {/* Main price */}
      <motion.p 
        className="text-4xl md:text-5xl font-bold text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {formatCurrency(price, currency, rate)}
      </motion.p>

      {/* Price per sqft */}
      {pricePerSqft && (
        <p className="text-base text-white/50 mt-1">
          {formatCurrency(pricePerSqft, currency, rate)}/sqft
        </p>
      )}

      {/* Market badge */}
      {marketDiffPercent !== null && marketDiffPercent !== undefined && Math.abs(marketDiffPercent) >= 5 && (
        <motion.span 
          className={cn(
            "inline-flex mt-3 px-3 py-1 text-xs font-semibold rounded-full",
            marketDiffPercent < -5 
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {marketDiffPercent < -5 
            ? `${Math.abs(Math.round(marketDiffPercent))}% below market`
            : `${Math.round(marketDiffPercent)}% premium`
          }
        </motion.span>
      )}

      {/* Project and location info */}
      <div className="mt-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">
          {projectName || 'Investment Property'}
        </h2>
        
        <div className="flex items-center flex-wrap gap-3 text-white/50 text-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{zoneName || 'Dubai'}</span>
          </div>
          
          {developerName && (
            <>
              <span className="text-white/30">•</span>
              <span 
                className={cn(
                  "transition-colors",
                  onDeveloperClick && "cursor-pointer hover:text-theme-accent"
                )}
                onClick={onDeveloperClick}
              >
                by {developerName}
              </span>
            </>
          )}
          
          {handoverQuarter && handoverYear && (
            <>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Q{handoverQuarter} {handoverYear}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

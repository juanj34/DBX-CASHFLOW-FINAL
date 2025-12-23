import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ZoneInfoCardProps {
  zone: {
    name: string;
    tagline?: string;
    description?: string;
    color: string;
    image_url?: string;
    // Investment Profile
    concept?: string;
    property_types?: string;
    investment_focus?: string;
    main_developer?: string;
    // Maturity
    maturity_level?: number;
    maturity_label?: string;
    // Prices
    price_range_min?: number;
    price_range_max?: number;
    ticket_1br_min?: number;
    ticket_1br_max?: number;
    // Legacy
    population?: number;
    occupancy_rate?: number;
    absorption_rate?: number;
  };
  onClose: () => void;
}

const formatPrice = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return value.toLocaleString();
};

export const ZoneInfoCard = ({ zone, onClose }: ZoneInfoCardProps) => {
  const hasInvestmentProfile = zone.concept || zone.investment_focus || zone.main_developer || 
    zone.maturity_level || zone.price_range_min || zone.ticket_1br_min;

  return (
    <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-20 w-auto sm:w-80 max-h-[80vh] overflow-y-auto shadow-xl z-10 bg-[#1a1f2e] border border-[#2a3142] rounded-xl" data-info-card>
      <div className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-xl font-semibold text-white leading-tight">{zone.name}</h3>
          {zone.tagline && (
            <p className="text-sm text-gray-400 italic mt-1">"{zone.tagline}"</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0 text-gray-400 hover:text-white hover:bg-[#2a3142]">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-4 pb-4 space-y-4">
        {zone.image_url && (
          <img 
            src={zone.image_url} 
            alt={zone.name}
            className="w-full h-40 object-cover rounded-lg"
          />
        )}

        {hasInvestmentProfile && (
          <div className="space-y-4">
            <p className="font-bold text-sm text-[#CCFF00] border-b border-[#2a3142] pb-1">Perfil de Inversión</p>

            {zone.concept && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Concepto</p>
                <p className="text-sm text-gray-400">{zone.concept}</p>
              </div>
            )}

            {(zone.maturity_level !== null && zone.maturity_level !== undefined) && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Nivel de Madurez</p>
                <div className="space-y-1">
                  <Progress value={zone.maturity_level} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{zone.maturity_level}%</span>
                    {zone.maturity_label && (
                      <span className="text-gray-500">{zone.maturity_label}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {zone.investment_focus && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Enfoque de Inversión</p>
                <p className="text-sm text-gray-400">{zone.investment_focus}</p>
              </div>
            )}

            {(zone.price_range_min || zone.price_range_max) && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Rango de Precios</p>
                <p className="text-sm text-gray-400">
                  {zone.price_range_min?.toLocaleString()} – {zone.price_range_max?.toLocaleString()} AED/sqft
                </p>
              </div>
            )}

            {(zone.ticket_1br_min || zone.ticket_1br_max) && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Ticket 1BR</p>
                <p className="text-sm text-gray-400">
                  {formatPrice(zone.ticket_1br_min || 0)} – {formatPrice(zone.ticket_1br_max || 0)} AED
                </p>
              </div>
            )}

            {zone.main_developer && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Desarrollador Principal</p>
                <p className="text-sm text-gray-400">{zone.main_developer}</p>
              </div>
            )}

            {zone.property_types && (
              <div>
                <p className="font-semibold text-sm mb-1 text-white">Tipos de Propiedad</p>
                <p className="text-sm text-gray-400">{zone.property_types}</p>
              </div>
            )}
          </div>
        )}

        {zone.description && (
          <div>
            <p className="font-semibold text-sm mb-1 text-white">Descripción</p>
            <p className="text-sm text-gray-400">{zone.description}</p>
          </div>
        )}

        {/* Legacy fields - only show if no investment profile */}
        {!hasInvestmentProfile && (
          <div className="space-y-2">
            {zone.population !== null && zone.population !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-white">Population:</span>
                <span className="text-gray-400">{zone.population.toLocaleString()}</span>
              </div>
            )}
            {zone.occupancy_rate !== null && zone.occupancy_rate !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-white">Occupancy Rate:</span>
                <span className="text-gray-400">{zone.occupancy_rate}%</span>
              </div>
            )}
            {zone.absorption_rate !== null && zone.absorption_rate !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-white">Absorption Rate:</span>
                <span className="text-gray-400">{zone.absorption_rate}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

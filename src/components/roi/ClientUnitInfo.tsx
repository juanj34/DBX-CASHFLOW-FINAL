import { Building, User, MapPin, Home, Pencil, Ruler, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { COUNTRIES, UNIT_TYPES } from "./ClientUnitModal";

export interface ClientUnitData {
  developer: string;
  clientName: string;
  clientCountry: string;
  brokerName: string;
  unit: string;
  unitSizeSqf: number;
  unitSizeM2: number;
  unitType: string;
}

interface ClientUnitInfoProps {
  data: ClientUnitData;
  onEditClick: () => void;
}

export const ClientUnitInfo = ({ data, onEditClick }: ClientUnitInfoProps) => {
  const { language, t } = useLanguage();

  const country = COUNTRIES.find(c => c.code === data.clientCountry);
  const unitType = UNIT_TYPES.find(u => u.value === data.unitType);

  const hasData = data.developer || data.clientName || data.unit;

  if (!hasData) {
    return (
      <div 
        onClick={onEditClick}
        className="bg-[#1a1f2e]/50 border border-dashed border-[#2a3142] rounded-2xl p-6 mb-6 flex items-center justify-center cursor-pointer hover:bg-[#1a1f2e] hover:border-[#CCFF00]/30 transition-all"
      >
        <div className="text-center">
          <Plus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">{t('clickToAddClientInfo')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Main Info Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
          {/* Developer */}
          {data.developer && (
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('developer')}</p>
                <p className="text-sm font-medium text-white">{data.developer}</p>
              </div>
            </div>
          )}

          {/* Client Name */}
          {data.clientName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('client')}</p>
                <p className="text-sm font-medium text-white">{data.clientName}</p>
              </div>
            </div>
          )}

          {/* Client Country */}
          {country && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('country')}</p>
                <p className="text-sm font-medium text-white">
                  {country.flag} {language === 'es' ? country.nameEs : country.name}
                </p>
              </div>
            </div>
          )}

          {/* Broker */}
          {data.brokerName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('broker')}</p>
                <p className="text-sm font-medium text-white">{data.brokerName}</p>
              </div>
            </div>
          )}

          {/* Unit */}
          {data.unit && (
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('unit')}</p>
                <p className="text-sm font-medium text-white">{data.unit}</p>
                {unitType && (
                  <p className="text-xs text-gray-400">
                    {language === 'es' ? unitType.labelEs : unitType.labelEn}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Unit Size */}
          {data.unitSizeSqf > 0 && (
            <div className="flex items-start gap-2">
              <Ruler className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('size')}</p>
                <p className="text-sm font-medium text-white">
                  {data.unitSizeSqf.toLocaleString()} sqf
                </p>
                <p className="text-xs text-gray-400">
                  ({data.unitSizeM2.toLocaleString()} m²)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditClick}
          className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

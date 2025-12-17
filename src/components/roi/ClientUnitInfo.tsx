import { Building, User, MapPin, Home, Pencil, Ruler, Plus, Building2, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { COUNTRIES, UNIT_TYPES, Client } from "./ClientUnitModal";
import { AdvisorInfo } from "./AdvisorInfo";
import { Profile } from "@/hooks/useProfile";

export interface ClientUnitData {
  developer: string;
  projectName?: string;
  clients: Client[];
  // Legacy fields for backward compatibility
  clientName?: string;
  clientCountry?: string;
  brokerName: string;
  unit: string;
  unitSizeSqf: number;
  unitSizeM2: number;
  unitType: string;
}

interface ClientUnitInfoProps {
  data: ClientUnitData;
  onEditClick: () => void;
  brokerProfile?: Profile | null;
}

export const ClientUnitInfo = ({ data, onEditClick, brokerProfile }: ClientUnitInfoProps) => {
  const { language, t } = useLanguage();

  const unitType = UNIT_TYPES.find(u => u.value === data.unitType);

  // Get clients array, handling legacy single client format
  const clients = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  const hasData = data.developer || clients.length > 0 || data.unit || data.projectName;

  if (!hasData) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 mb-6">
        {/* Header with Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00EAFF]/20 rounded-xl">
              <Rocket className="w-5 h-5 text-[#00EAFF]" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('cashflowStatement')}</h2>
          </div>
        </div>
        
        <div 
          onClick={onEditClick}
          className="border border-dashed border-[#2a3142] rounded-xl p-6 flex items-center justify-center cursor-pointer hover:bg-[#0d1117] hover:border-[#CCFF00]/30 transition-all"
        >
          <div className="text-center">
            <Plus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{t('clickToAddClientInfo')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 mb-6">
      {/* Header with Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00EAFF]/20 rounded-xl">
            <Rocket className="w-5 h-5 text-[#00EAFF]" />
          </div>
          <h2 className="text-lg font-bold text-white">{t('cashflowStatement')}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditClick}
          className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* Property Info Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
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

          {/* Project Name */}
          {data.projectName && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('projectName')}</p>
                <p className="text-sm font-medium text-white">{data.projectName}</p>
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

        {/* Vertical Divider */}
        {clients.length > 0 && (
          <div className="hidden lg:block w-px bg-[#2a3142] self-stretch" />
        )}

        {/* Clients Section */}
        {clients.length > 0 && (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#00EAFF]" />
              <p className="text-xs text-gray-500">{t('clients')}</p>
            </div>
            <div className="space-y-1.5">
              {clients.map((client) => {
                const country = COUNTRIES.find(c => c.code === client.country);
                return (
                  <div key={client.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{client.name}</span>
                    {country && (
                      <span className="text-sm text-gray-400">
                        {country.flag}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { Building, User, MapPin, Home, Pencil, Ruler, Plus, Building2, Users, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIT_TYPES, Client } from "./ClientUnitModal";
import { COUNTRIES, getCountryByCode } from "@/data/countries";

export interface ClientShare {
  clientId: string;
  sharePercent: number;
}

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
  // Payment split feature
  splitEnabled?: boolean;
  clientShares?: ClientShare[];
  // Zone feature
  zoneId?: string;
  zoneName?: string;
}

interface ClientUnitInfoProps {
  data: ClientUnitData;
  onEditClick: () => void;
  readOnly?: boolean;
}

export const ClientUnitInfo = ({ data, onEditClick, readOnly = false }: ClientUnitInfoProps) => {
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
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 mb-4">
        {!readOnly ? (
          <div 
            onClick={onEditClick}
            className="border border-dashed border-[#2a3142] rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-[#0d1117] hover:border-[#CCFF00]/30 transition-all"
          >
            <div className="text-center">
              <Plus className="w-6 h-6 text-gray-500 mx-auto mb-1" />
              <p className="text-gray-400 text-sm">{t('clickToAddClientInfo')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No client information</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 mb-4">
      <div className="flex flex-wrap items-start gap-4">
        {/* Property Info Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-3">
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

          {/* Zone */}
          {data.zoneName && (
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('zone')}</p>
                <p className="text-sm font-medium text-cyan-400">{data.zoneName}</p>
              </div>
            </div>
          )}

          {/* Clients inline */}
          {clients.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-[#00EAFF] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('clients')}</p>
                <div className="space-y-0.5">
                  {clients.map((client) => {
                    const country = getCountryByCode(client.country);
                    return (
                      <p key={client.id} className="text-sm font-medium text-white flex items-center gap-1">
                        {client.name}
                        {country && <span className="text-xs">{country.flag}</span>}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button - hidden in read-only mode */}
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
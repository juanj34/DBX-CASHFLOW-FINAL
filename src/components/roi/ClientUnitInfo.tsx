import { useState } from "react";
import { Building, User, MapPin, Home, Pencil, Ruler, Plus, Building2, Users, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIT_TYPES, Client } from "./ClientUnitModal";
import { COUNTRIES, getCountryByCode } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperInfoModal } from "./DeveloperInfoModal";
import { ProjectInfoModal } from "./ProjectInfoModal";
import { cn } from "@/lib/utils";

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
  // Bedroom count for villa/townhouse
  bedrooms?: number;
  // Plot size for villa/townhouse (in sqf)
  plotSizeSqf?: number;
  plotSizeM2?: number;
  // Payment split feature
  splitEnabled?: boolean;
  clientShares?: ClientShare[];
  // Zone feature
  zoneId?: string;
  zoneName?: string;
  // IDs for direct lookup
  developerId?: string;
  projectId?: string;
}

interface ClientUnitInfoProps {
  data: ClientUnitData;
  onEditClick?: () => void;
  readOnly?: boolean;
}

export const ClientUnitInfo = ({ data, onEditClick, readOnly = false }: ClientUnitInfoProps) => {
  const { language, t } = useLanguage();
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const unitType = UNIT_TYPES.find(u => u.value === data.unitType);

  // Fetch developer by ID or name
  const { data: developer } = useQuery({
    queryKey: ['developer-info', data.developerId, data.developer],
    queryFn: async () => {
      if (data.developerId) {
        const { data: dev } = await supabase
          .from('developers')
          .select('*')
          .eq('id', data.developerId)
          .maybeSingle();
        return dev;
      }
      if (data.developer) {
        const { data: dev } = await supabase
          .from('developers')
          .select('*')
          .ilike('name', data.developer)
          .maybeSingle();
        return dev;
      }
      return null;
    },
    enabled: !!(data.developerId || data.developer),
  });

  // Fetch project by ID or name
  const { data: project } = useQuery({
    queryKey: ['project-info', data.projectId, data.projectName],
    queryFn: async () => {
      if (data.projectId) {
        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .eq('id', data.projectId)
          .maybeSingle();
        return proj;
      }
      if (data.projectName) {
        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .ilike('name', data.projectName)
          .maybeSingle();
        return proj;
      }
      return null;
    },
    enabled: !!(data.projectId || data.projectName),
  });

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
        {!readOnly && onEditClick ? (
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
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-3">
          {/* Developer - Clickable */}
          {data.developer && (
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('developer')}</p>
                <p 
                  className={cn(
                    "text-sm font-medium text-white",
                    developer && "cursor-pointer hover:text-[#CCFF00] transition-colors"
                  )}
                  onClick={() => developer && setDeveloperModalOpen(true)}
                >
                  {data.developer}
                </p>
              </div>
            </div>
          )}

          {/* Project Name - Clickable */}
          {data.projectName && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('projectName')}</p>
                <p 
                  className={cn(
                    "text-sm font-medium text-white",
                    project && "cursor-pointer hover:text-[#CCFF00] transition-colors"
                  )}
                  onClick={() => project && setProjectModalOpen(true)}
                >
                  {data.projectName}
                </p>
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
                    {data.bedrooms && (data.unitType === 'villa' || data.unitType === 'townhouse') && (
                      <span> - {data.bedrooms} {language === 'es' ? 'Hab.' : 'BR'}</span>
                    )}
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
                {/* Plot size for villa/townhouse */}
                {data.plotSizeSqf && data.plotSizeSqf > 0 && (data.unitType === 'villa' || data.unitType === 'townhouse') && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {language === 'es' ? 'Terreno' : 'Plot'}: {data.plotSizeSqf.toLocaleString()} sqf
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Zone */}
          {data.zoneName && (
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t('zone')}</p>
                <p className="text-sm font-medium text-cyan-400">
                  {data.zoneName.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}
                </p>
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
                      <p key={client.id} className="text-sm font-medium text-white flex items-center gap-1 whitespace-nowrap">
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
        {!readOnly && onEditClick && (
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

      {/* Developer Modal */}
      {developer && (
        <DeveloperInfoModal
          developerId={developer.id}
          open={developerModalOpen}
          onOpenChange={setDeveloperModalOpen}
        />
      )}

      {/* Project Modal */}
      {project && (
        <ProjectInfoModal
          project={project}
          zoneName={data.zoneName}
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
        />
      )}
    </div>
  );
};
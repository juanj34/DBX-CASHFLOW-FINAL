import { useState } from "react";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { FloorPlanLightbox } from "@/components/roi/FloorPlanLightbox";
import { BuildingRenderCard } from "@/components/roi/BuildingRenderCard";
import { DeveloperInfoModal } from "@/components/roi/DeveloperInfoModal";
import { ProjectInfoModal } from "@/components/roi/ProjectInfoModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Ruler, Calendar, Building2, MapPin, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  clientInfo: ClientUnitData;
  customDifferentiators?: any[];
  onEditConfig: () => void;
  onEditClient: () => void;
  variant?: 'default' | 'dashboard';
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  showLogoOverlay?: boolean;
  developerId?: string | null;
  projectId?: string | null;
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
    'Colombia': '🇨🇴', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷',
  };
  return flags[country] || '🌍';
};

export const PropertyTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  clientInfo,
  customDifferentiators = [],
  onEditConfig,
  onEditClient,
  variant = 'default',
  floorPlanUrl,
  buildingRenderUrl,
  showLogoOverlay = false,
  developerId,
  projectId,
}: PropertyTabContentProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // Fetch developer data
  const { data: developer } = useQuery({
    queryKey: ['developer', developerId, clientInfo.developer],
    queryFn: async () => {
      if (developerId) {
        const { data } = await supabase.from('developers').select('*').eq('id', developerId).single();
        return data;
      }
      if (clientInfo.developer) {
        const { data } = await supabase.from('developers').select('*').ilike('name', clientInfo.developer).maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!(developerId || clientInfo.developer),
  });

  // Fetch project data
  const { data: project } = useQuery({
    queryKey: ['project', projectId, clientInfo.projectName],
    queryFn: async () => {
      if (projectId) {
        const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
        return data;
      }
      if (clientInfo.projectName) {
        const { data } = await supabase.from('projects').select('*').ilike('name', clientInfo.projectName).maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!(projectId || clientInfo.projectName),
  });

  // Fetch zone data
  const { data: zone } = useQuery({
    queryKey: ['zone', clientInfo.zoneName],
    queryFn: async () => {
      if (clientInfo.zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label').ilike('name', clientInfo.zoneName).maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!clientInfo.zoneName,
  });

  const hasImages = floorPlanUrl || buildingRenderUrl;
  const unitSizeM2 = clientInfo.unitSizeSqf ? Math.round(clientInfo.unitSizeSqf * 0.092903) : null;
  const pricePerSqft = clientInfo.unitSizeSqf ? inputs.basePrice / clientInfo.unitSizeSqf : null;

  // Client list
  const clientList = clientInfo.clients?.length 
    ? clientInfo.clients 
    : clientInfo.clientName 
      ? [{ id: '1', name: clientInfo.clientName, country: clientInfo.clientCountry }] 
      : [];

  if (variant === 'dashboard') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* LEFT COLUMN (1/3) - Info Cards */}
        <div className="space-y-3 min-w-0">
          {/* Price Hero Card */}
          <div className="bg-theme-card border border-theme-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] text-theme-text-muted uppercase tracking-wide mb-0.5">Total Investment</p>
                <p className="text-2xl font-bold text-theme-accent">
                  {formatCurrency(inputs.basePrice, currency, rate)}
                </p>
                {pricePerSqft && (
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    {formatCurrency(pricePerSqft, currency, rate)}/sqft
                  </p>
                )}
              </div>
              {clientInfo.unitType && (
                <span className="px-2 py-1 bg-theme-accent/10 text-theme-accent text-xs font-semibold rounded-md">
                  {clientInfo.unitType}
                </span>
              )}
            </div>

            {/* Unit Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme-border">
              <div>
                <p className="text-[10px] text-theme-text-muted mb-0.5">Unit</p>
                <p className="text-sm font-semibold text-theme-text">{clientInfo.unit || 'TBD'}</p>
              </div>
              {clientInfo.unitSizeSqf > 0 && (
                <div>
                  <p className="text-[10px] text-theme-text-muted mb-0.5">Size</p>
                  <p className="text-sm font-semibold text-theme-text">
                    {clientInfo.unitSizeSqf.toLocaleString()} sqft
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-theme-text-muted mb-0.5">Handover</p>
                <p className="text-sm font-semibold text-theme-text">
                  Q{inputs.handoverQuarter} {inputs.handoverYear}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-theme-text-muted mb-0.5">Status</p>
                <p className="text-sm font-semibold text-theme-text">
                  {calculations.totalMonths > 0 ? 'Off-Plan' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          {/* Project Card */}
          <div 
            className={cn(
              "bg-theme-card border border-theme-border rounded-xl p-3",
              project && "cursor-pointer hover:border-theme-accent/50 transition-colors"
            )}
            onClick={() => project && setProjectModalOpen(true)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                {project?.logo_url ? (
                  <img src={project.logo_url} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <Building2 className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-theme-text-muted uppercase tracking-wide">Project</p>
                <p className="text-sm font-semibold text-theme-text truncate">
                  {project?.name || clientInfo.projectName || 'Not specified'}
                </p>
              </div>
              {project && <ChevronRight className="w-4 h-4 text-theme-text-muted flex-shrink-0" />}
            </div>
          </div>

          {/* Developer Card */}
          <div 
            className={cn(
              "bg-theme-card border border-theme-border rounded-xl p-3",
              developer && "cursor-pointer hover:border-theme-accent/50 transition-colors"
            )}
            onClick={() => developer && setDeveloperModalOpen(true)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                {developer?.logo_url ? (
                  <img src={developer.logo_url} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <Building2 className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-theme-text-muted uppercase tracking-wide">Developer</p>
                <p className="text-sm font-semibold text-theme-text truncate">
                  {developer?.name || clientInfo.developer || 'Not specified'}
                </p>
              </div>
              {developer && <ChevronRight className="w-4 h-4 text-theme-text-muted flex-shrink-0" />}
            </div>
          </div>

          {/* Zone Card */}
          <div className="bg-theme-card border border-theme-border rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-theme-text-muted uppercase tracking-wide">Zone</p>
                <p className="text-sm font-semibold text-theme-text truncate">
                  {zone?.name || clientInfo.zoneName || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Clients - Compact stacked */}
          {clientList.length > 0 && (
            <div className="bg-theme-card border border-theme-border rounded-xl p-3">
              <p className="text-[10px] text-theme-text-muted uppercase tracking-wide mb-2">
                {clientList.length === 1 ? 'Client' : `${clientList.length} Clients`}
              </p>
              <div className="space-y-1.5">
                {clientList.map((client) => (
                  <div 
                    key={client.id} 
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-md text-sm"
                  >
                    {client.country && (
                      <span className="text-sm">{getCountryFlag(client.country)}</span>
                    )}
                    <span className="font-medium text-theme-text truncate">{client.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floor Plan Button */}
          {floorPlanUrl && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-full bg-theme-card border border-theme-border rounded-xl p-3 hover:border-theme-accent/50 transition-colors flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-theme-text">View Floor Plan</p>
                <p className="text-[10px] text-theme-text-muted">Click to enlarge</p>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-text-muted group-hover:text-theme-accent transition-colors" />
            </button>
          )}

          {/* Value Differentiators */}
          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <ValueDifferentiatorsDisplay
              selectedDifferentiators={inputs.valueDifferentiators}
              customDifferentiators={customDifferentiators}
              onEditClick={onEditConfig}
            />
          )}
        </div>

        {/* RIGHT COLUMN (2/3) - Building Render Hero */}
        {buildingRenderUrl && (
          <div className="lg:col-span-2">
            <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden h-full">
              <BuildingRenderCard
                imageUrl={buildingRenderUrl}
                developerId={developerId}
                showLogoOverlay={showLogoOverlay}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Lightbox */}
        {floorPlanUrl && (
          <FloorPlanLightbox
            imageUrl={floorPlanUrl}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        )}

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
            zoneName={clientInfo.zoneName}
            open={projectModalOpen}
            onOpenChange={setProjectModalOpen}
          />
        )}
      </div>
    );
  }

  // Default variant (non-dashboard)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClientUnitInfo data={clientInfo} onEditClick={onEditClient} />
        <InvestmentSnapshot 
          inputs={inputs} 
          currency={currency} 
          totalMonths={calculations.totalMonths} 
          totalEntryCosts={calculations.totalEntryCosts} 
          rate={rate} 
          holdAnalysis={calculations.holdAnalysis} 
          unitSizeSqf={clientInfo.unitSizeSqf} 
        />
      </div>
      
      <ValueDifferentiatorsDisplay
        selectedDifferentiators={inputs.valueDifferentiators || []}
        customDifferentiators={customDifferentiators}
        onEditClick={onEditConfig}
      />
    </div>
  );
};

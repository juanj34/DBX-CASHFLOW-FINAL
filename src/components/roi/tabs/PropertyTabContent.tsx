import { useState } from "react";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { FloorPlanLightbox } from "@/components/roi/FloorPlanLightbox";
import { BuildingRenderCard } from "@/components/roi/BuildingRenderCard";
import { DeveloperInfoModal } from "@/components/roi/DeveloperInfoModal";
import { ProjectInfoModal } from "@/components/roi/ProjectInfoModal";
import { AssetUnitCard } from "@/components/roi/showcase/AssetUnitCard";
import { AssetProjectCard } from "@/components/roi/showcase/AssetProjectCard";
import { AssetClientsCard } from "@/components/roi/showcase/AssetClientsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch developer data if developerId is provided or developer name exists
  const { data: developer } = useQuery({
    queryKey: ['developer', developerId, clientInfo.developer],
    queryFn: async () => {
      if (developerId) {
        const { data } = await supabase
          .from('developers')
          .select('*')
          .eq('id', developerId)
          .single();
        return data;
      }
      if (clientInfo.developer) {
        const { data } = await supabase
          .from('developers')
          .select('*')
          .ilike('name', clientInfo.developer)
          .maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!(developerId || clientInfo.developer),
  });

  // Fetch project data if projectId is provided or project name exists
  const { data: project } = useQuery({
    queryKey: ['project', projectId, clientInfo.projectName],
    queryFn: async () => {
      if (projectId) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        return data;
      }
      if (clientInfo.projectName) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .ilike('name', clientInfo.projectName)
          .maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!(projectId || clientInfo.projectName),
  });

  const hasImages = floorPlanUrl || buildingRenderUrl;
  // Only show cards if actual database records exist, not just name strings
  const hasDeveloper = !!developer;
  const hasProject = !!project;

  // Fetch zone data if available
  const { data: zone } = useQuery({
    queryKey: ['zone', clientInfo.zoneName],
    queryFn: async () => {
      if (clientInfo.zoneName) {
        const { data } = await supabase
          .from('zones')
          .select('id, name, maturity_level, maturity_label')
          .ilike('name', clientInfo.zoneName)
          .maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!clientInfo.zoneName,
  });

  if (variant === 'dashboard') {
    return (
      <div className="space-y-4">
        {/* Row 1: Images - Floor Plan + Building Render */}
        {hasImages && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Floor Plan - Clickable for lightbox */}
            {floorPlanUrl && (
              <div 
                className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 cursor-pointer hover:border-[#CCFF00]/50 transition-colors group"
                onClick={() => setLightboxOpen(true)}
              >
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Floor Plan</p>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#0d1117]">
                  <img 
                    src={floorPlanUrl} 
                    alt="Floor Plan" 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Click to enlarge</p>
              </div>
            )}
            
            {/* Building Render with Logo Overlay */}
            {buildingRenderUrl && (
              <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Building Render</p>
                <BuildingRenderCard
                  imageUrl={buildingRenderUrl}
                  developerId={developerId}
                  showLogoOverlay={showLogoOverlay}
                />
              </div>
            )}
          </div>
        )}

        {/* Row 2: Unit Details + Project/Developer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unit Card */}
          <AssetUnitCard
            unitNumber={clientInfo.unit}
            unitType={clientInfo.unitType}
            unitSizeSqf={clientInfo.unitSizeSqf}
            basePrice={inputs.basePrice}
            handoverQuarter={`Q${inputs.handoverQuarter}`}
            handoverYear={inputs.handoverYear}
            currency={currency}
            rate={rate}
          />

          {/* Project + Developer + Zone Card */}
          <AssetProjectCard
            project={project}
            developer={developer}
            zone={zone}
            zoneName={clientInfo.zoneName}
            onDeveloperClick={() => developer && setDeveloperModalOpen(true)}
            onProjectClick={() => project && setProjectModalOpen(true)}
          />
        </div>

        {/* Row 3: Clients */}
        <AssetClientsCard
          clients={clientInfo.clients}
          clientName={clientInfo.clientName}
          clientCountry={clientInfo.clientCountry}
        />
        
        {/* Row 4: Value Differentiators */}
        {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
          <ValueDifferentiatorsDisplay
            selectedDifferentiators={inputs.valueDifferentiators}
            customDifferentiators={customDifferentiators}
            onEditClick={onEditConfig}
          />
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

  return (
    <div className="space-y-6">
      {/* Row 1: Client Info + Investment Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClientUnitInfo 
          data={clientInfo} 
          onEditClick={onEditClient} 
        />
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
      
      {/* Row 2: Value Differentiators */}
      <ValueDifferentiatorsDisplay
        selectedDifferentiators={inputs.valueDifferentiators || []}
        customDifferentiators={customDifferentiators}
        onEditClick={onEditConfig}
      />
    </div>
  );
};

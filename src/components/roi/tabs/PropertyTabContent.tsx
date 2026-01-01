import { useState } from "react";
import { motion } from "framer-motion";
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
import { Home, Ruler, Calendar, Building2, MapPin, Users, ChevronRight, TrendingUp, Wallet, Receipt } from "lucide-react";
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }
  }
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
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, price_range_min, price_range_max').ilike('name', clientInfo.zoneName).maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!clientInfo.zoneName,
  });

  const hasImages = floorPlanUrl || buildingRenderUrl;
  const unitSizeM2 = clientInfo.unitSizeSqf ? Math.round(clientInfo.unitSizeSqf * 0.092903) : null;
  const pricePerSqft = clientInfo.unitSizeSqf ? inputs.basePrice / clientInfo.unitSizeSqf : null;

  // Financial calculations for hard numbers
  const DLD_FEE_PERCENT = 4;
  const downpaymentAmount = inputs.basePrice * inputs.downpaymentPercent / 100;
  const dldFeeAmount = inputs.basePrice * DLD_FEE_PERCENT / 100;
  const cashToBook = downpaymentAmount + dldFeeAmount + inputs.oqoodFee;
  const netYield = calculations.holdAnalysis?.rentalYieldOnInvestment || 0;
  const serviceCharge = inputs.serviceChargePerSqft || 0;

  // Market comparison
  const zoneAvgPrice = zone?.price_range_min && zone?.price_range_max
    ? (zone.price_range_min + zone.price_range_max) / 2
    : null;
  const marketDiffPercent = pricePerSqft && zoneAvgPrice
    ? ((pricePerSqft - zoneAvgPrice) / zoneAvgPrice) * 100
    : null;

  // Client list
  const clientList = clientInfo.clients?.length 
    ? clientInfo.clients 
    : clientInfo.clientName 
      ? [{ id: '1', name: clientInfo.clientName, country: clientInfo.clientCountry }] 
      : [];

  if (variant === 'dashboard') {
    return (
      <div className="h-full overflow-hidden">
        {/* Main 2-column grid filling full height */}
        <div className={cn(
          "grid gap-6 h-full",
          buildingRenderUrl ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}>
          {/* LEFT COLUMN - Narrative structure */}
          <motion.div 
            className="flex flex-col h-full gap-4 overflow-y-auto min-h-0 pr-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* MASTER HEADER - Identity (No Box) */}
            <motion.div className="flex-shrink-0" variants={itemVariants}>
              <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-1 leading-tight">
                {project?.name || clientInfo.projectName || 'Investment Property'}
              </h1>
              <div className="flex items-center gap-2 text-theme-text-muted flex-wrap">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {zone?.name || clientInfo.zoneName || 'Dubai'}
                </span>
                {(developer?.name || clientInfo.developer) && (
                  <>
                    <span className="text-theme-border">•</span>
                    <span 
                      className={cn(
                        "text-sm transition-all duration-200",
                        developer && [
                          "cursor-pointer",
                          "underline decoration-transparent decoration-1 underline-offset-2",
                          "hover:decoration-theme-accent hover:text-theme-accent"
                        ]
                      )}
                      onClick={() => developer && setDeveloperModalOpen(true)}
                    >
                      by {developer?.name || clientInfo.developer}
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* INVESTMENT CARD - The Asset */}
            <motion.div 
              className="bg-theme-card border border-theme-border rounded-xl p-5 flex-shrink-0"
              variants={itemVariants}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-3xl font-bold text-theme-accent">
                    {formatCurrency(inputs.basePrice, currency, rate)}
                  </p>
                  {pricePerSqft && (
                    <p className="text-sm text-theme-text-muted mt-1">
                      {formatCurrency(pricePerSqft, currency, rate)}/sqft
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {clientInfo.unitType && (
                    <span className="px-3 py-1.5 bg-theme-accent/10 text-theme-accent text-sm font-semibold rounded-lg">
                      {clientInfo.unitType}
                    </span>
                  )}
                  {marketDiffPercent !== null && Math.abs(marketDiffPercent) >= 5 && (
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      marketDiffPercent < -5 
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    )}>
                      {marketDiffPercent < -5 
                        ? `${Math.abs(Math.round(marketDiffPercent))}% below market`
                        : `${Math.round(marketDiffPercent)}% premium`
                      }
                    </span>
                  )}
                </div>
              </div>
              
              {/* Inline Unit Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-theme-text pt-4 border-t border-theme-border">
                <span className="font-medium">Unit {clientInfo.unit || 'TBD'}</span>
                {clientInfo.unitSizeSqf > 0 && (
                  <>
                    <span className="text-theme-border">·</span>
                    <span>{clientInfo.unitSizeSqf.toLocaleString()} sqft</span>
                  </>
                )}
                <span className="text-theme-border">·</span>
                <span>{calculations.totalMonths > 0 ? 'Off-Plan' : 'Ready'}</span>
                <span className="text-theme-border">·</span>
                <span>Handover Q{inputs.handoverQuarter} {inputs.handoverYear}</span>
              </div>

              {/* Financial Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-theme-border">
                {/* Est. Net Yield */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-theme-text">{netYield.toFixed(1)}%</p>
                    <p className="text-xs text-theme-text-muted">Est. Net Yield</p>
                  </div>
                </div>

                {/* Cash to Book */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-theme-text">{formatCurrency(cashToBook, currency, rate)}</p>
                    <p className="text-xs text-theme-text-muted">Cash to Book</p>
                  </div>
                </div>

                {/* Service Charge */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-theme-muted/50 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-theme-text-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-theme-text">{serviceCharge}</p>
                    <p className="text-xs text-theme-text-muted">AED/sqft</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SECONDARY INFO ROW - Clients + Floor Plan */}
            <motion.div className="grid grid-cols-2 gap-3 flex-shrink-0" variants={itemVariants}>
              {/* Clients Card */}
              <div className="bg-theme-card border border-theme-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-theme-text-muted uppercase tracking-wide">
                      {clientList.length === 1 ? 'Client' : 'Clients'}
                    </p>
                    {clientList.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {clientList[0].country && (
                          <span className="text-sm">{getCountryFlag(clientList[0].country)}</span>
                        )}
                        <p className="text-sm font-semibold text-theme-text truncate">
                          {clientList[0].name}
                          {clientList.length > 1 && ` +${clientList.length - 1}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-theme-text">TBD</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Floor Plan CTA */}
              {floorPlanUrl ? (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="bg-theme-card border border-theme-border rounded-xl p-4 hover:border-theme-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <Ruler className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs text-theme-text-muted">View</p>
                      <p className="text-sm font-semibold text-theme-text">Floor Plan</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-text-muted group-hover:text-theme-accent transition-colors" />
                  </div>
                </button>
              ) : (
                /* Empty placeholder to maintain grid */
                <div className="bg-theme-card/50 border border-theme-border/50 rounded-xl p-4 flex items-center justify-center">
                  <p className="text-xs text-theme-text-muted">No floor plan</p>
                </div>
              )}
            </motion.div>

            {/* VALUE DIFFERENTIATORS - Fills remaining space */}
            {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
              <motion.div className="flex-1 min-h-0" variants={itemVariants}>
                <ValueDifferentiatorsDisplay
                  selectedDifferentiators={inputs.valueDifferentiators}
                  customDifferentiators={customDifferentiators}
                  onEditClick={onEditConfig}
                />
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT COLUMN - Building Render */}
          {buildingRenderUrl && (
            <div className="relative h-full min-h-0 overflow-hidden rounded-2xl bg-theme-card border border-theme-border">
              <BuildingRenderCard
                imageUrl={buildingRenderUrl}
                developerId={developerId}
                showLogoOverlay={showLogoOverlay}
                className="absolute inset-0"
              />
            </div>
          )}
        </div>

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

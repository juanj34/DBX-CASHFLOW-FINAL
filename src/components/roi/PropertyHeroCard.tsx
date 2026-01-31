import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Building, Building2, Home, Ruler, Users, Pencil, Plus, MapPin, LayoutGrid, FileImage, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIT_TYPES } from "./ClientUnitModal";
import { getCountryByCode } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperInfoModal } from "./DeveloperInfoModal";
import { ProjectInfoModal } from "./ProjectInfoModal";
import { cn } from "@/lib/utils";
import type { ClientUnitData } from "./ClientUnitInfo";
import { Currency, CURRENCY_CONFIG, formatDualCurrency } from "./currencyUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyHeroCardProps {
  data: ClientUnitData;
  heroImageUrl?: string | null;
  buildingRenderUrl?: string | null;
  onEditClick?: () => void;
  readOnly?: boolean;
  // Optional props for Snapshot view
  showPriceInfo?: boolean;
  basePrice?: number;
  pricePerSqft?: number;
  currency?: Currency;
  setCurrency?: (c: Currency) => void;
  language?: 'en' | 'es';
  setLanguage?: (l: 'en' | 'es') => void;
  rate?: number;
  // New props for View Project and Floor Plans buttons
  floorPlanUrl?: string | null;
  onViewFloorPlan?: () => void;
  // Snapshot title (editable headline)
  snapshotTitle?: string | null;
  onSnapshotTitleChange?: (title: string) => void;
}

export const PropertyHeroCard = ({ 
  data, 
  heroImageUrl, 
  buildingRenderUrl, 
  onEditClick, 
  readOnly = false,
  showPriceInfo = false,
  basePrice = 0,
  pricePerSqft = 0,
  currency = 'AED',
  setCurrency,
  language = 'en',
  setLanguage,
  rate = 1,
  floorPlanUrl,
  onViewFloorPlan,
  snapshotTitle,
  onSnapshotTitleChange,
}: PropertyHeroCardProps) => {
  const { language: contextLanguage, t } = useLanguage();
  // Use prop language if provided for snapshot view, otherwise use context
  const displayLanguage = showPriceInfo ? language : contextLanguage;
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(snapshotTitle || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update editedTitle when snapshotTitle changes
  useEffect(() => {
    setEditedTitle(snapshotTitle || '');
  }, [snapshotTitle]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    if (onSnapshotTitleChange) {
      onSnapshotTitleChange(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(snapshotTitle || '');
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Get default title based on language
  const defaultTitle = displayLanguage === 'es' ? 'Estado de Flujo de Caja Mensual' : 'Monthly Cashflow Statement';
  const displayTitle = snapshotTitle || defaultTitle;

  const unitType = UNIT_TYPES.find(u => u.value === data.unitType);

  // Fetch developer
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

  // Fetch project
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

  // Get clients array
  const clients = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  const hasData = data.developer || clients.length > 0 || data.unit || data.projectName;

  // Background image - prefer project hero image
  const backgroundImage = project?.hero_image_url || heroImageUrl || buildingRenderUrl;
  const hasBackgroundImage = !!backgroundImage;

  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        {!readOnly && onEditClick ? (
          <div 
            onClick={onEditClick}
            className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">{t('clickToAddClientInfo')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted-foreground text-sm">No property information</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="relative overflow-hidden rounded-xl mb-4 min-h-[180px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Background Image Layer - More visible */}
        <div className="absolute inset-0">
          {backgroundImage ? (
            <>
              <motion.img 
                src={backgroundImage} 
                alt="Property" 
                className="w-full h-full object-cover"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </>
          ) : (
            /* Theme-aware fallback gradient when no image */
            <div className="absolute inset-0 bg-gradient-to-r from-theme-card via-theme-bg to-theme-card" />
          )}
        </div>

        {/* Content - 2 Rows */}
        <div className="relative px-5 py-6 min-h-[160px] flex flex-col justify-end">
          
          {/* Currency & Language Dropdowns - Bottom right */}
          {showPriceInfo && setCurrency && setLanguage && (
            <div className="absolute bottom-4 right-5 flex items-center gap-2 z-20">
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className={cn(
                  "w-[90px] h-7 text-xs",
                  hasBackgroundImage 
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-theme-bg-alt hover:bg-theme-card-alt border-theme-border text-theme-text"
                )}>
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <span>{CURRENCY_CONFIG[currency].flag}</span>
                      <span>{currency}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border z-50">
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
                    <SelectItem key={c} value={c} className="text-theme-text hover:bg-theme-card-alt">
                      <span className="flex items-center gap-2">
                        <span>{CURRENCY_CONFIG[c].flag}</span>
                        <span>{c}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es')}>
                <SelectTrigger className={cn(
                  "w-[65px] h-7 text-xs",
                  hasBackgroundImage 
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-theme-bg-alt hover:bg-theme-card-alt border-theme-border text-theme-text"
                )}>
                  <SelectValue>{language.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border z-50">
                  <SelectItem value="en" className="text-theme-text hover:bg-theme-card-alt">EN</SelectItem>
                  <SelectItem value="es" className="text-theme-text hover:bg-theme-card-alt">ES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          
          {/* Snapshot Title (editable headline) - Only in Snapshot view */}
          {showPriceInfo && (
            <div className="mb-2">
              {!readOnly && onSnapshotTitleChange && isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    className="text-xs uppercase tracking-wider bg-white/10 border-white/30 text-white placeholder:text-white/50 h-7 w-auto min-w-[200px]"
                    placeholder={defaultTitle}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTitleSave}
                    className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTitleCancel}
                    className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p 
                  onClick={() => !readOnly && onSnapshotTitleChange && setIsEditingTitle(true)}
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    backgroundImage ? "text-white/60" : "text-theme-text-muted",
                    !readOnly && onSnapshotTitleChange && "cursor-pointer hover:text-theme-accent transition-colors group"
                  )}
                >
                  {displayTitle}
                  {!readOnly && onSnapshotTitleChange && (
                    <Pencil className="w-3 h-3 inline ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </p>
              )}
            </div>
          )}

          {/* Row 1: Project + Zone */}
          <div className="flex items-center justify-between mb-3">
            <h1 
              onClick={() => project && setProjectModalOpen(true)}
              className={cn(
                "text-2xl md:text-3xl font-bold transition-colors",
                backgroundImage ? "text-white" : "text-theme-text",
                project && "cursor-pointer hover:text-theme-accent"
              )}
            >
              {data.projectName || t('unnamedProject')}
            </h1>
            
            <div className="flex items-center gap-3">
              {data.zoneName && (
                <span className={cn(
                  "flex items-center gap-1.5 text-sm",
                  backgroundImage ? "text-white/80" : "text-theme-text-muted"
                )}>
                  <MapPin className="w-4 h-4 text-theme-accent" />
                  {data.zoneName}
                </span>
              )}
              
              {/* View Project and Floor Plans buttons - Only in Snapshot view */}
              {showPriceInfo && (
                <div className="flex items-center gap-2">
                  {project && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectModalOpen(true)}
                      className={cn(
                        "h-7 px-2 text-xs border",
                        backgroundImage 
                          ? "text-white/70 hover:text-white hover:bg-white/10 border-white/20"
                          : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt border-theme-border"
                      )}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                      {t('viewProjectButton')}
                    </Button>
                  )}
                  {floorPlanUrl && onViewFloorPlan && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onViewFloorPlan}
                      className={cn(
                        "h-7 px-2 text-xs border",
                        backgroundImage 
                          ? "text-white/70 hover:text-white hover:bg-white/10 border-white/20"
                          : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt border-theme-border"
                      )}
                    >
                      <FileImage className="w-3.5 h-3.5 mr-1" />
                      {t('floorPlanLabel')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Developer • Unit • Type • Size • Client */}
          <div className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 text-sm",
            backgroundImage ? "text-white/80" : "text-theme-text-muted"
          )}>
            
            {/* Developer */}
            {data.developer && (
              <>
                <span 
                  onClick={() => developer && setDeveloperModalOpen(true)}
                  className={cn(
                    "flex items-center gap-2",
                    developer && "cursor-pointer hover:text-theme-accent transition-colors"
                  )}
                >
                  {developer?.logo_url ? (
                    <img 
                      src={developer.logo_url} 
                      alt={data.developer}
                      className={cn(
                        "w-5 h-5 rounded object-contain",
                        backgroundImage ? "bg-white/10" : "bg-theme-card-alt"
                      )}
                    />
                  ) : (
                    <Building className="w-4 h-4 text-primary" />
                  )}
                  <span className={cn("font-medium", backgroundImage ? "text-white" : "text-theme-text")}>
                    {data.developer}
                  </span>
                </span>
                <span className={cn("hidden sm:inline", backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>•</span>
              </>
            )}
            
            {/* Unit */}
            {data.unit && (
              <>
                <span className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-theme-accent" />
                  <span className={cn(backgroundImage ? "text-white" : "text-theme-text")}>{data.unit}</span>
                </span>
                <span className={cn("hidden sm:inline", backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>•</span>
              </>
            )}
            
            {/* Type */}
            {unitType && (
              <>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className={cn(backgroundImage ? "text-white" : "text-theme-text")}>
                    {displayLanguage === 'es' ? unitType.labelEs : unitType.labelEn}
                    {data.bedrooms && ` ${data.bedrooms}BR`}
                  </span>
                </span>
                <span className={cn("hidden sm:inline", backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>•</span>
              </>
            )}
            
            {/* Size */}
            {data.unitSizeSqf > 0 && (
              <>
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-purple-400" />
                  <span className={cn(backgroundImage ? "text-white" : "text-theme-text")}>{data.unitSizeSqf.toLocaleString()} sqf</span>
                </span>
                <span className={cn("hidden sm:inline", backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>•</span>
              </>
            )}
            
            {/* Clients */}
            {clients.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-theme-accent-secondary" />
                {clients.slice(0, 2).map((client, i) => {
                  const country = getCountryByCode(client.country);
                  return (
                    <span key={client.id} className="flex items-center gap-1">
                      <span className={cn(backgroundImage ? "text-white" : "text-theme-text")}>{client.name}</span>
                      {country && <span className="text-xs">{country.flag}</span>}
                      {i < Math.min(clients.length, 2) - 1 && <span className={cn(backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>,</span>}
                    </span>
                  );
                })}
                {clients.length > 2 && (
                  <span className={cn("text-xs", backgroundImage ? "text-white/50" : "text-theme-text-muted")}>+{clients.length - 2}</span>
                )}
              </span>
            )}
          </div>

          {/* Price Info Row - Only in Snapshot view */}
          {showPriceInfo && basePrice > 0 && (
            <div className={cn(
              "flex items-center gap-4 mt-3 pt-3 border-t",
              backgroundImage ? "border-white/10" : "border-theme-border"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn("font-semibold", backgroundImage ? "text-white" : "text-theme-text")}>
                  {formatDualCurrency(basePrice, currency, rate).primary}
                </span>
                {formatDualCurrency(basePrice, currency, rate).secondary && (
                  <span className={cn("text-sm", backgroundImage ? "text-white/60" : "text-theme-text-muted")}>
                    ({formatDualCurrency(basePrice, currency, rate).secondary})
                  </span>
                )}
              </div>
              {pricePerSqft > 0 && (
                <>
                  <span className={cn(backgroundImage ? "text-white/30" : "text-theme-text-muted/50")}>•</span>
                  <span className={cn("text-sm", backgroundImage ? "text-white/80" : "text-theme-text-muted")}>
                    {formatDualCurrency(pricePerSqft, currency, rate).primary}/sqft
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit Button - Only show if not in snapshot mode */}
        {!readOnly && onEditClick && !showPriceInfo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className={cn(
              "absolute top-3 right-3 h-8 w-8",
              backgroundImage 
                ? "text-white/50 hover:text-white hover:bg-white/10"
                : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
            )}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Modals */}
      <DeveloperInfoModal
        developerId={developer?.id || null}
        open={developerModalOpen}
        onOpenChange={setDeveloperModalOpen}
      />

      <ProjectInfoModal
        project={project}
        zoneName={data.zoneName}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
    </>
  );
};

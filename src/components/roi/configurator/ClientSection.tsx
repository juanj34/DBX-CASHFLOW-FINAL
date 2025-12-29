import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { ZoneSelect } from "@/components/ui/zone-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Users, Percent, AlertCircle, MapPin, Building, Building2, Image, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientUnitData, ClientShare } from "../ClientUnitInfo";
import { Client, UNIT_TYPES } from "../ClientUnitModal";
import { DeveloperSelect } from "./DeveloperSelect";
import { ProjectSelect } from "./ProjectSelect";
import { ImageUploadCard } from "./ImageUploadCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientSectionProps {
  clientInfo: ClientUnitData;
  onClientInfoChange: (data: ClientUnitData) => void;
  floorPlanUrl: string | null;
  buildingRenderUrl: string | null;
  onFloorPlanChange: (file: File | null) => void;
  onBuildingRenderChange: (file: File | null) => void;
  showLogoOverlay: boolean;
  onShowLogoOverlayChange: (show: boolean) => void;
  quoteId?: string;
}

const SQF_TO_M2 = 0.092903;

export const ClientSection = ({
  clientInfo,
  onClientInfoChange,
  floorPlanUrl,
  buildingRenderUrl,
  onFloorPlanChange,
  onBuildingRenderChange,
  showLogoOverlay,
  onShowLogoOverlayChange,
  quoteId,
}: ClientSectionProps) => {
  const { language, t } = useLanguage();
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [manualDeveloper, setManualDeveloper] = useState(false);
  const [manualProject, setManualProject] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      }
    };
    checkAdminRole();
  }, []);

  // Get clients array, handling legacy format
  const clients: Client[] = clientInfo.clients?.length > 0 
    ? clientInfo.clients 
    : clientInfo.clientName 
      ? [{ id: '1', name: clientInfo.clientName, country: clientInfo.clientCountry || '' }]
      : [];

  // Get client shares, defaulting to equal distribution
  const clientShares: ClientShare[] = clientInfo.clientShares?.length > 0 
    ? clientInfo.clientShares 
    : clients.map(c => ({ clientId: c.id, sharePercent: clients.length > 0 ? 100 / clients.length : 0 }));

  // Calculate total share percentage
  const totalSharePercent = clientShares.reduce((sum, s) => sum + s.sharePercent, 0);
  const isShareValid = Math.abs(totalSharePercent - 100) < 0.01;

  const handleChange = (field: keyof ClientUnitData, value: string | number | boolean) => {
    if (field === 'unitSizeSqf') {
      const sqf = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const m2 = Math.round(sqf * SQF_TO_M2 * 10) / 10;
      onClientInfoChange({ ...clientInfo, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else if (field === 'unitSizeM2') {
      const m2 = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const sqf = Math.round(m2 / SQF_TO_M2);
      onClientInfoChange({ ...clientInfo, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else {
      onClientInfoChange({ ...clientInfo, [field]: value });
    }
  };

  const handleAddClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: '',
      country: '',
    };
    const newClients = [...clients, newClient];
    const equalShare = 100 / newClients.length;
    const newShares = newClients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onClientInfoChange({ ...clientInfo, clients: newClients, clientShares: newShares });
  };

  const handleRemoveClient = (clientId: string) => {
    if (clients.length <= 1) return;
    const newClients = clients.filter(c => c.id !== clientId);
    const equalShare = 100 / newClients.length;
    const newShares = newClients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onClientInfoChange({ ...clientInfo, clients: newClients, clientShares: newShares });
  };

  const handleClientChange = (clientId: string, field: keyof Client, value: string) => {
    const updatedClients = clients.map(c => 
      c.id === clientId ? { ...c, [field]: value } : c
    );
    onClientInfoChange({ ...clientInfo, clients: updatedClients });
  };

  const handleShareChange = (clientId: string, sharePercent: number) => {
    const updatedShares = clientShares.map(s => 
      s.clientId === clientId ? { ...s, sharePercent } : s
    );
    if (!updatedShares.find(s => s.clientId === clientId)) {
      updatedShares.push({ clientId, sharePercent });
    }
    onClientInfoChange({ ...clientInfo, clientShares: updatedShares });
  };

  const handleDistributeEqually = () => {
    const equalShare = 100 / clients.length;
    const newShares = clients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onClientInfoChange({ ...clientInfo, clientShares: newShares });
  };

  const handleToggleSplit = (enabled: boolean) => {
    if (enabled && clients.length >= 2) {
      const equalShare = 100 / clients.length;
      const newShares = clients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
      onClientInfoChange({ ...clientInfo, splitEnabled: enabled, clientShares: newShares });
    } else {
      onClientInfoChange({ ...clientInfo, splitEnabled: enabled });
    }
  };

  const handleDeveloperSelect = (developerId: string | null, developerName: string) => {
    setSelectedDeveloperId(developerId);
    setManualDeveloper(false);
    handleChange('developer', developerName);
  };

  const handleProjectSelect = (projectId: string | null, projectData: any) => {
    setSelectedProjectId(projectId);
    setManualProject(false);
    const projectName = projectData?.name || '';
    handleChange('projectName', projectName);
    
    // Auto-populate zone if project has one
    if (projectData?.zone_id) {
      onClientInfoChange({
        ...clientInfo,
        projectName,
        zoneId: projectData.zone_id,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Details Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#CCFF00]" />
          Property Details
        </h3>
        
        <div className="space-y-4">
          {/* Developer Selection */}
          {manualDeveloper ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{t('developer')}</label>
                {isAdmin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#CCFF00] hover:text-[#CCFF00]/80 hover:bg-[#CCFF00]/10"
                          onClick={() => window.open('/map-config?tab=developers', '_blank')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Add new developer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Input
                value={clientInfo.developer}
                onChange={(e) => handleChange('developer', e.target.value)}
                placeholder="e.g. Emaar"
                className="bg-[#0d1117] border-[#2a3142] text-white h-9"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{t('developer')}</label>
                {isAdmin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#CCFF00] hover:text-[#CCFF00]/80 hover:bg-[#CCFF00]/10"
                          onClick={() => window.open('/map-config?tab=developers', '_blank')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Add new developer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <DeveloperSelect
                value={selectedDeveloperId}
                manualValue={clientInfo.developer}
                onValueChange={handleDeveloperSelect}
                onManualMode={() => setManualDeveloper(true)}
              />
            </div>
          )}

          {/* Project Selection */}
          {manualProject ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{t('projectName')}</label>
                {isAdmin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#CCFF00] hover:text-[#CCFF00]/80 hover:bg-[#CCFF00]/10"
                          onClick={() => window.open('/map-config?tab=projects', '_blank')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Add new project</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Input
                value={clientInfo.projectName || ''}
                onChange={(e) => handleChange('projectName', e.target.value)}
                placeholder="e.g. The Valley"
                className="bg-[#0d1117] border-[#2a3142] text-white h-9"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{t('projectName')}</label>
                {isAdmin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#CCFF00] hover:text-[#CCFF00]/80 hover:bg-[#CCFF00]/10"
                          onClick={() => window.open('/map-config?tab=projects', '_blank')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Add new project</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <ProjectSelect
                value={selectedProjectId}
                developerId={selectedDeveloperId}
                manualValue={clientInfo.projectName || ''}
                onValueChange={handleProjectSelect}
                onManualMode={() => setManualProject(true)}
              />
            </div>
          )}

          {/* Unit Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unit')}</label>
              <Input
                value={clientInfo.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="bg-[#0d1117] border-[#2a3142] text-white h-9"
              />
            </div>

            {/* Unit Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitType')}</label>
              <Select value={clientInfo.unitType} onValueChange={(v) => handleChange('unitType', v)}>
                <SelectTrigger className="bg-[#0d1117] border-[#2a3142] text-white h-9">
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                  {UNIT_TYPES.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]"
                    >
                      {language === 'es' ? type.labelEs : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bedroom Count - only for villa/townhouse */}
            {(clientInfo.unitType === 'villa' || clientInfo.unitType === 'townhouse') && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-gray-400">{language === 'es' ? 'Habitaciones' : 'Bedrooms'}</label>
                <Select 
                  value={clientInfo.bedrooms?.toString() || ''} 
                  onValueChange={(v) => handleChange('bedrooms', parseInt(v) || 0)}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#2a3142] text-white h-9">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem 
                        key={num} 
                        value={num.toString()}
                        className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]"
                      >
                        {num} {language === 'es' ? 'Habitaciones' : 'Bedrooms'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unit Size sqf */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitSizeSqf')}</label>
              <Input
                type="number"
                value={clientInfo.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="sqf"
                className="bg-[#0d1117] border-[#2a3142] text-white h-9"
              />
            </div>

            {/* Unit Size m2 */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitSizeM2')}</label>
              <Input
                type="number"
                value={clientInfo.unitSizeM2 || ''}
                onChange={(e) => handleChange('unitSizeM2', parseFloat(e.target.value) || 0)}
                placeholder="m²"
                className="bg-[#0d1117] border-[#2a3142] text-white h-9"
              />
            </div>

            {/* Plot Size - only for villa/townhouse */}
            {(clientInfo.unitType === 'villa' || clientInfo.unitType === 'townhouse') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">{language === 'es' ? 'Terreno (sqf)' : 'Plot Size (sqf)'}</label>
                  <Input
                    type="number"
                    value={clientInfo.plotSizeSqf || ''}
                    onChange={(e) => {
                      const sqf = parseFloat(e.target.value) || 0;
                      const m2 = Math.round(sqf * 0.092903 * 10) / 10;
                      onClientInfoChange({ ...clientInfo, plotSizeSqf: sqf, plotSizeM2: m2 });
                    }}
                    placeholder="sqf"
                    className="bg-[#0d1117] border-[#2a3142] text-white h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">{language === 'es' ? 'Terreno (m²)' : 'Plot Size (m²)'}</label>
                  <Input
                    type="number"
                    value={clientInfo.plotSizeM2 || ''}
                    onChange={(e) => {
                      const m2 = parseFloat(e.target.value) || 0;
                      const sqf = Math.round(m2 / 0.092903);
                      onClientInfoChange({ ...clientInfo, plotSizeSqf: sqf, plotSizeM2: m2 });
                    }}
                    placeholder="m²"
                    className="bg-[#0d1117] border-[#2a3142] text-white h-9"
                  />
                </div>
              </>
            )}
          </div>

          {/* Zone Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <label className="text-xs text-gray-400">{t('zone')}</label>
            </div>
            <ZoneSelect
              value={clientInfo.zoneId || ''}
              onValueChange={(zoneId, zone) => {
                onClientInfoChange({ 
                  ...clientInfo, 
                  zoneId, 
                  zoneName: zone?.name || '' 
                });
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Client Information Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00EAFF]" />
            {t('clients')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddClient}
            className="text-[#CCFF00] hover:text-[#CCFF00]/80 hover:bg-[#CCFF00]/10 h-7 gap-1"
          >
            <Plus className="w-3 h-3" />
            {t('addClient')}
          </Button>
        </div>
        
        <div className="space-y-2">
          {clients.map((client) => {
            const clientShare = clientShares.find(s => s.clientId === client.id)?.sharePercent || 0;
            return (
              <div key={client.id} className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
                <div className={`flex-1 grid gap-2 ${clientInfo.splitEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <Input
                    value={client.name}
                    onChange={(e) => handleClientChange(client.id, 'name', e.target.value)}
                    placeholder={t('clientName')}
                    className="bg-[#1a1f2e] border-[#2a3142] text-white h-9"
                  />
                  <CountrySelect
                    value={client.country}
                    onValueChange={(v) => handleClientChange(client.id, 'country', v)}
                    placeholder={t('selectCountry')}
                    className="bg-[#1a1f2e] border-[#2a3142] h-9 w-full"
                  />
                  {clientInfo.splitEnabled && (
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={clientShare || ''}
                        onChange={(e) => handleShareChange(client.id, parseFloat(e.target.value) || 0)}
                        placeholder="%"
                        className="bg-[#1a1f2e] border-[#2a3142] text-white h-9 pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveClient(client.id)}
                  disabled={clients.length <= 1}
                  className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 h-9 w-9 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Payment Split Toggle */}
        {clients.length >= 2 && (
          <div className="mt-3 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#CCFF00]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {t('splitPaymentsBetweenClients')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('assignContributionPercentage')}
                  </p>
                </div>
              </div>
              <Switch
                checked={clientInfo.splitEnabled || false}
                onCheckedChange={handleToggleSplit}
                className="data-[state=checked]:bg-[#CCFF00]"
              />
            </div>

            {clientInfo.splitEnabled && (
              <div className="mt-3 pt-3 border-t border-[#2a3142]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isShareValid ? 'text-green-400' : 'text-red-400'}`}>
                      {t('totalLabel')}: {totalSharePercent.toFixed(1)}%
                    </span>
                    {!isShareValid && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">{t('mustEqual100')}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDistributeEqually}
                    className="text-[#00EAFF] hover:text-[#00EAFF]/80 hover:bg-[#00EAFF]/10 h-7 text-xs"
                  >
                    {t('distributeEqually')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Images Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Image className="w-4 h-4 text-purple-400" />
          Property Images
        </h3>
        
        <div className="space-y-4">
          {/* Floor Plan */}
          <ImageUploadCard
            label="Floor Plan"
            sublabel="Upload unit floor plan"
            imageUrl={floorPlanUrl}
            onImageChange={onFloorPlanChange}
            onRemove={() => onFloorPlanChange(null)}
            aspectRatio="4/3"
            placeholder="Drag, paste (Ctrl+V), or click"
          />

          {/* Building Render */}
          <ImageUploadCard
            label="Building Render"
            sublabel="Upload project render"
            imageUrl={buildingRenderUrl}
            onImageChange={onBuildingRenderChange}
            onRemove={() => onBuildingRenderChange(null)}
            aspectRatio="16/9"
            placeholder="Drag, paste (Ctrl+V), or click"
          />

          {/* Logo Overlay Toggle */}
          {buildingRenderUrl && (
            <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
              <div>
                <p className="text-sm font-medium text-white">Show Developer Logo</p>
                <p className="text-xs text-gray-500">Overlay developer logo on render</p>
              </div>
              <Switch
                checked={showLogoOverlay}
                onCheckedChange={onShowLogoOverlayChange}
                className="data-[state=checked]:bg-[#CCFF00]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

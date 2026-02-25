import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { ZoneSelect } from "@/components/ui/zone-select";
import { Plus, Trash2, Users, Percent, AlertCircle, MapPin, Building, Building2, UserPlus, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientUnitData, ClientShare } from "../ClientUnitInfo";
import { Client, UNIT_TYPES } from "../ClientUnitModal";
import { DeveloperSelect } from "./DeveloperSelect";
import { ProjectSelect } from "./ProjectSelect";
import { ClientSelector } from "@/components/clients/ClientSelector";
import { Client as DbClient, useClients } from "@/hooks/useClients";
import { ClientForm } from "@/components/clients/ClientForm";
import { PaymentPlanExtractor } from "./PaymentPlanExtractor";
import type { AIPaymentPlanResult } from "@/lib/aiExtractionTypes";
import { applyExtractedPlan } from "@/lib/applyExtractedPlan";
import { OIInputs } from "../useOICalculations";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientSectionProps {
  clientInfo: ClientUnitData;
  onClientInfoChange: (data: ClientUnitData) => void;
  quoteId?: string;
  // For AI extraction to populate inputs
  inputs?: OIInputs;
  setInputs?: React.Dispatch<React.SetStateAction<OIInputs>>;
}

const SQF_TO_M2 = 0.092903;

export const ClientSection = ({
  clientInfo,
  onClientInfoChange,
  quoteId,
  inputs,
  setInputs,
}: ClientSectionProps) => {
  const { language, t } = useLanguage();
  const { clients: dbClients, createClient } = useClients();
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedDbClientId, setSelectedDbClientId] = useState<string | null>(clientInfo.dbClientId || null);
  const [showAIExtractor, setShowAIExtractor] = useState(false);

  // Simplified developer and project handlers (no more DB IDs)
  const handleDeveloperChange = (name: string) => {
    handleChange('developer', name);
  };

  const handleProjectChange = (name: string) => {
    handleChange('projectName', name);
  };

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

  // Note: handleDeveloperChange and handleProjectChange are defined above

  const handleDbClientSelect = (clientId: string | null, dbClient: DbClient | null) => {
    setSelectedDbClientId(clientId);
    if (dbClient) {
      // Auto-populate the first client with db client info
      const updatedClients = clients.length > 0 
        ? clients.map((c, i) => i === 0 ? { ...c, name: dbClient.name, country: dbClient.country || '' } : c)
        : [{ id: '1', name: dbClient.name, country: dbClient.country || '' }];
      
      onClientInfoChange({
        ...clientInfo,
        dbClientId: clientId || undefined,
        clients: updatedClients,
        clientName: dbClient.name, // Legacy field
        clientCountry: dbClient.country || undefined,
      });
    } else {
      onClientInfoChange({
        ...clientInfo,
        dbClientId: undefined,
      });
    }
  };

  const handleCreateNewClient = async (data: any) => {
    const newClient = await createClient(data);
    if (newClient) {
      handleDbClientSelect(newClient.id, newClient);
      setShowClientForm(false);
    }
  };

  // Handle AI extraction results
  const handleAIExtraction = (plan: AIPaymentPlanResult) => {
    if (inputs && setInputs) {
      const bookingDate = { month: inputs.bookingMonth, year: inputs.bookingYear };
      const { inputs: newInputs, clientInfo: newClientInfo } = applyExtractedPlan(plan, bookingDate, inputs);
      onClientInfoChange({ ...clientInfo, ...newClientInfo });
      setInputs(prev => ({ ...prev, ...newInputs }));
    } else {
      // No inputs — just update client info
      const SQF_TO_M2_LOCAL = 0.092903;
      const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2_LOCAL * 10) / 10;
      onClientInfoChange({
        ...clientInfo,
        ...(plan.developer && { developer: plan.developer }),
        ...(plan.projectName && { projectName: plan.projectName }),
        ...(plan.unitNumber && { unit: plan.unitNumber }),
        ...(plan.unitType && { unitType: plan.unitType }),
        ...(plan.sizeSqFt && { unitSizeSqf: plan.sizeSqFt, unitSizeM2: sqfToM2(plan.sizeSqFt) }),
      });
    }
    toast.success('Quote data imported from AI extraction!');
    setShowAIExtractor(false);
  };

  return (
    <>
      <ClientForm
        open={showClientForm}
        onClose={() => setShowClientForm(false)}
        onSubmit={handleCreateNewClient}
        mode="create"
      />
      <PaymentPlanExtractor
        open={showAIExtractor}
        onOpenChange={setShowAIExtractor}
        existingBookingMonth={inputs?.bookingMonth}
        existingBookingYear={inputs?.bookingYear}
        onApply={handleAIExtraction}
      />
    <div className="space-y-6">
      {/* AI Import Banner */}
      <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-theme-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Auto-Fill
            </h4>
            <p className="text-xs text-theme-text-muted mt-1">
              Upload a brochure or payment plan to auto-fill developer, unit info, price, and payment schedule.
            </p>
          </div>
          <Button
            onClick={() => setShowAIExtractor(true)}
            variant="outline"
            size="sm"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>
        </div>
      </div>

      {/* Property Details Section */}
      <div>
        <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-theme-accent" />
          Property Details
        </h3>
        
        <div className="space-y-4">
          {/* Developer Selection - Simplified */}
          <div className="space-y-1.5">
            <label className="text-xs text-theme-text-muted">{t('developer')}</label>
            <DeveloperSelect
              value={clientInfo.developer || ''}
              onValueChange={handleDeveloperChange}
            />
          </div>

          {/* Project Selection - Simplified */}
          <div className="space-y-1.5">
            <label className="text-xs text-theme-text-muted">{t('projectName')}</label>
            <ProjectSelect
              value={clientInfo.projectName || ''}
              developer={clientInfo.developer}
              onValueChange={handleProjectChange}
            />
          </div>

          {/* Unit Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unit')}</label>
              <Input
                value={clientInfo.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            {/* Unit Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unitType')}</label>
              <Select value={clientInfo.unitType} onValueChange={(v) => handleChange('unitType', v)}>
                <SelectTrigger className="bg-theme-bg border-theme-border text-theme-text h-9">
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {UNIT_TYPES.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className="text-theme-text hover:bg-theme-border focus:bg-theme-border"
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
                <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Habitaciones' : 'Bedrooms'}</label>
                <Select 
                  value={clientInfo.bedrooms?.toString() || ''} 
                  onValueChange={(v) => handleChange('bedrooms', parseInt(v) || 0)}
                >
                  <SelectTrigger className="bg-theme-bg border-theme-border text-theme-text h-9">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem 
                        key={num} 
                        value={num.toString()}
                        className="text-theme-text hover:bg-theme-border focus:bg-theme-border"
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
              <label className="text-xs text-theme-text-muted">{t('unitSizeSqf')}</label>
              <Input
                type="number"
                value={clientInfo.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="sqf"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            {/* Unit Size m2 */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unitSizeM2')}</label>
              <Input
                type="number"
                value={clientInfo.unitSizeM2 || ''}
                onChange={(e) => handleChange('unitSizeM2', parseFloat(e.target.value) || 0)}
                placeholder="m²"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            {/* Plot Size - only for villa/townhouse */}
            {(clientInfo.unitType === 'villa' || clientInfo.unitType === 'townhouse') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Terreno (sqf)' : 'Plot Size (sqf)'}</label>
                  <Input
                    type="number"
                    value={clientInfo.plotSizeSqf || ''}
                    onChange={(e) => {
                      const sqf = parseFloat(e.target.value) || 0;
                      const m2 = Math.round(sqf * 0.092903 * 10) / 10;
                      onClientInfoChange({ ...clientInfo, plotSizeSqf: sqf, plotSizeM2: m2 });
                    }}
                    placeholder="sqf"
                    className="bg-theme-bg border-theme-border text-theme-text h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Terreno (m²)' : 'Plot Size (m²)'}</label>
                  <Input
                    type="number"
                    value={clientInfo.plotSizeM2 || ''}
                    onChange={(e) => {
                      const m2 = parseFloat(e.target.value) || 0;
                      const sqf = Math.round(m2 / 0.092903);
                      onClientInfoChange({ ...clientInfo, plotSizeSqf: sqf, plotSizeM2: m2 });
                    }}
                    placeholder="m²"
                    className="bg-theme-bg border-theme-border text-theme-text h-9"
                  />
                </div>
              </>
            )}
          </div>

          {/* Zone Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-theme-accent-secondary" />
              <label className="text-xs text-theme-text-muted">{t('zone')}</label>
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
          <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2">
            <Users className="w-4 h-4 text-theme-accent-secondary" />
            {t('clients')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddClient}
            className="text-theme-accent hover:text-theme-accent/80 hover:bg-theme-accent/10 h-7 gap-1"
          >
            <Plus className="w-3 h-3" />
            {t('addClient')}
          </Button>
        </div>

        {/* Client Selector from Database */}
        <div className="mb-4 p-3 bg-theme-bg rounded-lg border border-theme-border">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-theme-accent" />
            <span className="text-xs text-theme-text-muted">Link to existing client</span>
          </div>
          <ClientSelector
            value={selectedDbClientId}
            onValueChange={handleDbClientSelect}
            onCreateNew={() => setShowClientForm(true)}
            placeholder="Select or create client..."
          />
          {selectedDbClientId && (
            <p className="text-xs text-green-400 mt-2">
              ✓ Quote will be linked to this client's portal
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          {clients.map((client) => {
            const clientShare = clientShares.find(s => s.clientId === client.id)?.sharePercent || 0;
            return (
              <div key={client.id} className="flex items-center gap-2 p-3 bg-theme-bg rounded-lg border border-theme-border">
                <div className={`flex-1 grid gap-2 ${clientInfo.splitEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <Input
                    value={client.name}
                    onChange={(e) => handleClientChange(client.id, 'name', e.target.value)}
                    placeholder={t('clientName')}
                    className="bg-theme-card border-theme-border text-theme-text h-9"
                  />
                  <CountrySelect
                    value={client.country}
                    onValueChange={(v) => handleClientChange(client.id, 'country', v)}
                    placeholder={t('selectCountry')}
                    className="bg-theme-card border-theme-border h-9 w-full"
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
                        className="bg-theme-card border-theme-border text-theme-text h-9 pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveClient(client.id)}
                  disabled={clients.length <= 1}
                  className="text-theme-text-muted hover:text-red-400 hover:bg-red-400/10 h-9 w-9 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Payment Split Toggle */}
        {clients.length >= 2 && (
          <div className="mt-3 p-3 bg-theme-bg rounded-lg border border-theme-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-theme-accent" />
                <div>
                  <p className="text-sm font-medium text-theme-text">
                    {t('splitPaymentsBetweenClients')}
                  </p>
                  <p className="text-xs text-theme-text-muted">
                    {t('assignContributionPercentage')}
                  </p>
                </div>
              </div>
              <Switch
                checked={clientInfo.splitEnabled || false}
                onCheckedChange={handleToggleSplit}
                className="data-[state=checked]:bg-theme-accent"
              />
            </div>

            {clientInfo.splitEnabled && (
              <div className="mt-3 pt-3 border-t border-theme-border">
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
                    className="text-theme-accent-secondary hover:text-theme-accent-secondary/80 hover:bg-theme-accent-secondary/10 h-7 text-xs"
                  >
                    {t('distributeEqually')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
    </>
  );
};

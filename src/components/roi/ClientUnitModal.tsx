import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, Plus, Trash2, Users, Percent, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientUnitData, ClientShare } from "./ClientUnitInfo";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  country: string;
}

interface ClientUnitModalProps {
  data: ClientUnitData;
  onChange: (data: ClientUnitData) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
}

const SQF_TO_M2 = 0.092903;

export const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', nameEs: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { code: 'CO', name: 'Colombia', nameEs: 'Colombia', flag: '🇨🇴' },
  { code: 'IN', name: 'India', nameEs: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido', flag: '🇬🇧' },
  { code: 'US', name: 'United States', nameEs: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'SA', name: 'Saudi Arabia', nameEs: 'Arabia Saudita', flag: '🇸🇦' },
  { code: 'PK', name: 'Pakistan', nameEs: 'Pakistán', flag: '🇵🇰' },
  { code: 'EG', name: 'Egypt', nameEs: 'Egipto', flag: '🇪🇬' },
  { code: 'RU', name: 'Russia', nameEs: 'Rusia', flag: '🇷🇺' },
  { code: 'CN', name: 'China', nameEs: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', nameEs: 'Alemania', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameEs: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', nameEs: 'Italia', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', nameEs: 'España', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', nameEs: 'Brasil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', nameEs: 'México', flag: '🇲🇽' },
  { code: 'CA', name: 'Canada', nameEs: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameEs: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', nameEs: 'Japón', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', nameEs: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'NG', name: 'Nigeria', nameEs: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', nameEs: 'Kenia', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', nameEs: 'Sudáfrica', flag: '🇿🇦' },
  { code: 'LB', name: 'Lebanon', nameEs: 'Líbano', flag: '🇱🇧' },
  { code: 'JO', name: 'Jordan', nameEs: 'Jordania', flag: '🇯🇴' },
  { code: 'KW', name: 'Kuwait', nameEs: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', nameEs: 'Catar', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', nameEs: 'Baréin', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameEs: 'Omán', flag: '🇴🇲' },
];

export const UNIT_TYPES = [
  { value: 'studio', labelEn: 'Studio', labelEs: 'Estudio' },
  { value: '1bed', labelEn: '1 Bedroom', labelEs: '1 Habitación' },
  { value: '2bed', labelEn: '2 Bedrooms', labelEs: '2 Habitaciones' },
  { value: '3bed', labelEn: '3 Bedrooms', labelEs: '3 Habitaciones' },
  { value: '4bed', labelEn: '4 Bedrooms', labelEs: '4 Habitaciones' },
  { value: 'penthouse', labelEn: 'Penthouse', labelEs: 'Penthouse' },
];

export const ClientUnitModal = ({ data, onChange, open, onOpenChange }: ClientUnitModalProps) => {
  const { language, t } = useLanguage();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);

  // Fetch zones with maturity level
  useEffect(() => {
    const fetchZones = async () => {
      if (!open) return;
      setLoadingZones(true);
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, maturity_level')
        .not('maturity_level', 'is', null)
        .order('name');
      
      if (!error && data) {
        setZones(data);
      }
      setLoadingZones(false);
    };
    fetchZones();
  }, [open]);

  // Get clients array, handling legacy format
  const clients: Client[] = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  // Get client shares, defaulting to equal distribution
  const clientShares: ClientShare[] = data.clientShares?.length > 0 
    ? data.clientShares 
    : clients.map(c => ({ clientId: c.id, sharePercent: clients.length > 0 ? 100 / clients.length : 0 }));

  // Calculate total share percentage
  const totalSharePercent = clientShares.reduce((sum, s) => sum + s.sharePercent, 0);
  const isShareValid = Math.abs(totalSharePercent - 100) < 0.01;

  const handleChange = (field: keyof ClientUnitData, value: string | number | boolean) => {
    if (field === 'unitSizeSqf') {
      const sqf = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const m2 = Math.round(sqf * SQF_TO_M2 * 10) / 10;
      onChange({ ...data, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else if (field === 'unitSizeM2') {
      const m2 = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const sqf = Math.round(m2 / SQF_TO_M2);
      onChange({ ...data, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const handleZoneChange = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    onChange({ 
      ...data, 
      zoneId, 
      zoneName: zone?.name || '' 
    });
  };

  const handleAddClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: '',
      country: '',
    };
    const newClients = [...clients, newClient];
    // Redistribute shares equally
    const equalShare = 100 / newClients.length;
    const newShares = newClients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onChange({ ...data, clients: newClients, clientShares: newShares });
  };

  const handleRemoveClient = (clientId: string) => {
    if (clients.length <= 1) return;
    const newClients = clients.filter(c => c.id !== clientId);
    // Redistribute shares equally
    const equalShare = 100 / newClients.length;
    const newShares = newClients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onChange({ ...data, clients: newClients, clientShares: newShares });
  };

  const handleClientChange = (clientId: string, field: keyof Client, value: string) => {
    const updatedClients = clients.map(c => 
      c.id === clientId ? { ...c, [field]: value } : c
    );
    onChange({ ...data, clients: updatedClients });
  };

  const handleShareChange = (clientId: string, sharePercent: number) => {
    const updatedShares = clientShares.map(s => 
      s.clientId === clientId ? { ...s, sharePercent } : s
    );
    // Add share if it doesn't exist
    if (!updatedShares.find(s => s.clientId === clientId)) {
      updatedShares.push({ clientId, sharePercent });
    }
    onChange({ ...data, clientShares: updatedShares });
  };

  const handleDistributeEqually = () => {
    const equalShare = 100 / clients.length;
    const newShares = clients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
    onChange({ ...data, clientShares: newShares });
  };

  const handleToggleSplit = (enabled: boolean) => {
    if (enabled && clients.length >= 2) {
      // Initialize shares equally when enabling
      const equalShare = 100 / clients.length;
      const newShares = clients.map(c => ({ clientId: c.id, sharePercent: equalShare }));
      onChange({ ...data, splitEnabled: enabled, clientShares: newShares });
    } else {
      onChange({ ...data, splitEnabled: enabled });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white gap-2"
        >
          <Settings2 className="w-4 h-4" />
          {t('clientDetails')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{t('clientUnitInfo')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Developer */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('developer')}</label>
              <Input
                value={data.developer}
                onChange={(e) => handleChange('developer', e.target.value)}
                placeholder="e.g. Emaar"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('projectName')}</label>
              <Input
                value={data.projectName || ''}
                onChange={(e) => handleChange('projectName', e.target.value)}
                placeholder="e.g. The Valley, Dubai Creek Tower"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unit')}</label>
              <Input
                value={data.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            {/* Unit Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitType')}</label>
              <Select value={data.unitType} onValueChange={(v) => handleChange('unitType', v)}>
                <SelectTrigger className="bg-[#0d1117] border-[#2a3142] text-white">
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

            {/* Unit Size sqf */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitSizeSqf')}</label>
              <Input
                type="number"
                value={data.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="sqf"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            {/* Unit Size m2 */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitSizeM2')}</label>
              <Input
                type="number"
                value={data.unitSizeM2 || ''}
                onChange={(e) => handleChange('unitSizeM2', parseFloat(e.target.value) || 0)}
                placeholder="m²"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>
          </div>

          {/* Zone Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <label className="text-xs text-gray-400">{t('zone')}</label>
            </div>
            <Select value={data.zoneId || ''} onValueChange={handleZoneChange}>
              <SelectTrigger className="bg-[#0d1117] border-[#2a3142] text-white">
                <SelectValue placeholder={loadingZones ? 'Loading...' : t('selectZone')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142] max-h-[200px]">
                {loadingZones ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-gray-500 text-sm py-2 px-2">{t('noZones')}</div>
                ) : (
                  zones.map((zone) => (
                    <SelectItem 
                      key={zone.id} 
                      value={zone.id}
                      className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]"
                    >
                      {zone.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {data.zoneName && (
              <p className="text-xs text-cyan-400">Selected: {data.zoneName}</p>
            )}
          </div>
            
            <div className="space-y-2">
              {clients.map((client) => {
                const clientShare = clientShares.find(s => s.clientId === client.id)?.sharePercent || 0;
                return (
                  <div key={client.id} className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
                    <div className={`flex-1 grid gap-2 ${data.splitEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <Input
                        value={client.name}
                        onChange={(e) => handleClientChange(client.id, 'name', e.target.value)}
                        placeholder={t('clientName')}
                        className="bg-[#1a1f2e] border-[#2a3142] text-white h-9"
                      />
                      <Select 
                        value={client.country} 
                        onValueChange={(v) => handleClientChange(client.id, 'country', v)}
                      >
                        <SelectTrigger className="bg-[#1a1f2e] border-[#2a3142] text-white h-9">
                          <SelectValue placeholder={t('selectCountry')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-[#2a3142] max-h-[200px]">
                          {COUNTRIES.map((country) => (
                            <SelectItem 
                              key={country.code} 
                              value={country.code}
                              className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]"
                            >
                              {country.flag} {language === 'es' ? country.nameEs : country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {data.splitEnabled && (
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
              <div className="mt-4 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#CCFF00]" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {language === 'es' ? 'Dividir pagos entre clientes' : 'Split payments between clients'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'es' ? 'Asignar porcentaje de contribución a cada cliente' : 'Assign contribution percentage to each client'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={data.splitEnabled || false}
                    onCheckedChange={handleToggleSplit}
                    className="data-[state=checked]:bg-[#CCFF00]"
                  />
                </div>

                {data.splitEnabled && (
                  <div className="mt-3 pt-3 border-t border-[#2a3142]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isShareValid ? 'text-green-400' : 'text-red-400'}`}>
                          {language === 'es' ? 'Total' : 'Total'}: {totalSharePercent.toFixed(1)}%
                        </span>
                        {!isShareValid && (
                          <div className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">{language === 'es' ? 'Debe sumar 100%' : 'Must equal 100%'}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDistributeEqually}
                        className="text-[#00EAFF] hover:text-[#00EAFF]/80 hover:bg-[#00EAFF]/10 h-7 text-xs"
                      >
                        {language === 'es' ? 'Distribuir equitativamente' : 'Distribute equally'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
          >
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { COUNTRIES, UNIT_TYPES };

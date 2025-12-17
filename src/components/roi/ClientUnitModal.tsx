import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Plus, Trash2, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientUnitData } from "./ClientUnitInfo";

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

const SQF_TO_M2 = 0.092903;

const COUNTRIES = [
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

const UNIT_TYPES = [
  { value: 'studio', labelEn: 'Studio', labelEs: 'Estudio' },
  { value: '1bed', labelEn: '1 Bedroom', labelEs: '1 Habitación' },
  { value: '2bed', labelEn: '2 Bedrooms', labelEs: '2 Habitaciones' },
  { value: '3bed', labelEn: '3 Bedrooms', labelEs: '3 Habitaciones' },
  { value: '4bed', labelEn: '4 Bedrooms', labelEs: '4 Habitaciones' },
  { value: 'penthouse', labelEn: 'Penthouse', labelEs: 'Penthouse' },
];

export const ClientUnitModal = ({ data, onChange, open, onOpenChange }: ClientUnitModalProps) => {
  const { language, t } = useLanguage();

  // Get clients array, handling legacy format
  const clients: Client[] = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  const handleChange = (field: keyof ClientUnitData, value: string | number) => {
    if (field === 'unitSizeSqf') {
      const sqf = typeof value === 'number' ? value : parseFloat(value) || 0;
      const m2 = Math.round(sqf * SQF_TO_M2 * 10) / 10;
      onChange({ ...data, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else if (field === 'unitSizeM2') {
      const m2 = typeof value === 'number' ? value : parseFloat(value) || 0;
      const sqf = Math.round(m2 / SQF_TO_M2);
      onChange({ ...data, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const handleAddClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: '',
      country: '',
    };
    onChange({ ...data, clients: [...clients, newClient] });
  };

  const handleRemoveClient = (clientId: string) => {
    if (clients.length <= 1) return; // Keep at least one client
    onChange({ ...data, clients: clients.filter(c => c.id !== clientId) });
  };

  const handleClientChange = (clientId: string, field: keyof Client, value: string) => {
    const updatedClients = clients.map(c => 
      c.id === clientId ? { ...c, [field]: value } : c
    );
    onChange({ ...data, clients: updatedClients });
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

          {/* Clients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00EAFF]" />
                <label className="text-sm font-medium text-white">{t('clients')}</label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddClient}
                className="border-[#2a3142] bg-[#0d1117] text-gray-300 hover:bg-[#2a3142] hover:text-white gap-1 h-7 text-xs"
              >
                <Plus className="w-3 h-3" />
                {t('addClient')}
              </Button>
            </div>
            
            <div className="space-y-2">
              {clients.map((client, index) => (
                <div key={client.id} className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
                  <div className="flex-1 grid grid-cols-2 gap-2">
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
              ))}
            </div>
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

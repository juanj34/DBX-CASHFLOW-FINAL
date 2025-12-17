import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientUnitData } from "./ClientUnitInfo";

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
        
        <div className="grid grid-cols-2 gap-4 mt-4">
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

          {/* Project Name - NEW FIELD */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">{t('projectName')}</label>
            <Input
              value={data.projectName || ''}
              onChange={(e) => handleChange('projectName', e.target.value)}
              placeholder="e.g. The Valley, Dubai Creek Tower"
              className="bg-[#0d1117] border-[#2a3142] text-white"
            />
          </div>

          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">{t('clientName')}</label>
            <Input
              value={data.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              placeholder="Full name"
              className="bg-[#0d1117] border-[#2a3142] text-white"
            />
          </div>

          {/* Client Country */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">{t('clientCountry')}</label>
            <Select value={data.clientCountry} onValueChange={(v) => handleChange('clientCountry', v)}>
              <SelectTrigger className="bg-[#0d1117] border-[#2a3142] text-white">
                <SelectValue placeholder={t('selectCountry')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142] max-h-[300px]">
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

          {/* Advisor Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">{t('advisorName')}</label>
            <Input
              value={data.brokerName}
              onChange={(e) => handleChange('brokerName', e.target.value)}
              placeholder="Advisor name"
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

import { useState } from "react";
import { ChevronDown, ChevronUp, User, Building, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ClientUnitData {
  developer: string;
  clientName: string;
  clientCountry: string;
  brokerName: string;
  unit: string;
  unitSizeSqf: number;
  unitType: string;
}

interface ClientUnitInfoProps {
  data: ClientUnitData;
  onChange: (data: ClientUnitData) => void;
}

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', nameEs: 'Emiratos Árabes Unidos' },
  { code: 'CO', name: 'Colombia', nameEs: 'Colombia' },
  { code: 'IN', name: 'India', nameEs: 'India' },
  { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido' },
  { code: 'US', name: 'United States', nameEs: 'Estados Unidos' },
  { code: 'SA', name: 'Saudi Arabia', nameEs: 'Arabia Saudita' },
  { code: 'PK', name: 'Pakistan', nameEs: 'Pakistán' },
  { code: 'EG', name: 'Egypt', nameEs: 'Egipto' },
  { code: 'RU', name: 'Russia', nameEs: 'Rusia' },
  { code: 'CN', name: 'China', nameEs: 'China' },
  { code: 'DE', name: 'Germany', nameEs: 'Alemania' },
  { code: 'FR', name: 'France', nameEs: 'Francia' },
  { code: 'IT', name: 'Italy', nameEs: 'Italia' },
  { code: 'ES', name: 'Spain', nameEs: 'España' },
  { code: 'BR', name: 'Brazil', nameEs: 'Brasil' },
  { code: 'MX', name: 'Mexico', nameEs: 'México' },
  { code: 'CA', name: 'Canada', nameEs: 'Canadá' },
  { code: 'AU', name: 'Australia', nameEs: 'Australia' },
  { code: 'JP', name: 'Japan', nameEs: 'Japón' },
  { code: 'KR', name: 'South Korea', nameEs: 'Corea del Sur' },
  { code: 'NG', name: 'Nigeria', nameEs: 'Nigeria' },
  { code: 'KE', name: 'Kenya', nameEs: 'Kenia' },
  { code: 'ZA', name: 'South Africa', nameEs: 'Sudáfrica' },
];

const UNIT_TYPES = [
  { value: 'studio', labelEn: 'Studio', labelEs: 'Estudio' },
  { value: '1bed', labelEn: '1 Bedroom', labelEs: '1 Habitación' },
  { value: '2bed', labelEn: '2 Bedrooms', labelEs: '2 Habitaciones' },
  { value: '3bed', labelEn: '3 Bedrooms', labelEs: '3 Habitaciones' },
  { value: '4bed', labelEn: '4 Bedrooms', labelEs: '4 Habitaciones' },
  { value: 'penthouse', labelEn: 'Penthouse', labelEs: 'Penthouse' },
];

export const ClientUnitInfo = ({ data, onChange }: ClientUnitInfoProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { language, t } = useLanguage();

  const handleChange = (field: keyof ClientUnitData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1f2e]/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-[#CCFF00]" />
          <span className="font-semibold text-white">{t('clientUnitInfo')}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Developer */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <Building className="w-3 h-3" />
                {t('developer')}
              </label>
              <Input
                value={data.developer}
                onChange={(e) => handleChange('developer', e.target.value)}
                placeholder="e.g. Emaar"
                className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm"
              />
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('clientName')}</label>
              <Input
                value={data.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Full name"
                className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm"
              />
            </div>

            {/* Client Country */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t('clientCountry')}
              </label>
              <Select value={data.clientCountry} onValueChange={(v) => handleChange('clientCountry', v)}>
                <SelectTrigger className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm">
                  <SelectValue placeholder={t('selectCountry')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142] max-h-[300px]">
                  {COUNTRIES.map((country) => (
                    <SelectItem 
                      key={country.code} 
                      value={country.code}
                      className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]"
                    >
                      {language === 'es' ? country.nameEs : country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Broker Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('brokerName')}</label>
              <Input
                value={data.brokerName}
                onChange={(e) => handleChange('brokerName', e.target.value)}
                placeholder="Broker"
                className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unit')}</label>
              <Input
                value={data.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm"
              />
            </div>

            {/* Unit Size */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">{t('unitSize')}</label>
              <Input
                type="number"
                value={data.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="sqf"
                className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm"
              />
            </div>

            {/* Unit Type */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs text-gray-400">{t('unitType')}</label>
              <Select value={data.unitType} onValueChange={(v) => handleChange('unitType', v)}>
                <SelectTrigger className="h-9 bg-[#0d1117] border-[#2a3142] text-white text-sm">
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
          </div>
        </div>
      )}
    </div>
  );
};

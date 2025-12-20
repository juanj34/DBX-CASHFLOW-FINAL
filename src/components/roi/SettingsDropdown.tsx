import { Settings, Globe, Coins, User, Wifi, WifiOff, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';

interface SettingsDropdownProps {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  isLive: boolean;
}

export const SettingsDropdown = ({
  language,
  setLanguage,
  currency,
  setCurrency,
  exchangeRate,
  isLive,
}: SettingsDropdownProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 w-8"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-[#1a1f2e] border-[#2a3142] z-50 w-56"
      >
        {/* Exchange rate indicator */}
        {currency !== 'AED' && (
          <>
            <div className={`mx-2 my-1.5 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>1 AED = {exchangeRate.toFixed(4)} {currency}</span>
            </div>
            <DropdownMenuSeparator className="bg-[#2a3142]" />
          </>
        )}

        {/* Profile Settings */}
        <DropdownMenuItem
          onClick={() => navigate('/account-settings')}
          className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2"
        >
          <User className="w-4 h-4" />
          {t('profileSettings')}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#2a3142]" />

        {/* Language Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2">
            <Globe className="w-4 h-4" />
            {t('language')}: {language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
            <DropdownMenuItem
              onClick={() => setLanguage('en')}
              className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2"
            >
              {language === 'en' && <Check className="w-3 h-3 text-[#CCFF00]" />}
              <span className={language !== 'en' ? 'ml-5' : ''}>🇬🇧 English</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLanguage('es')}
              className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2"
            >
              {language === 'es' && <Check className="w-3 h-3 text-[#CCFF00]" />}
              <span className={language !== 'es' ? 'ml-5' : ''}>🇪🇸 Español</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Currency Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2">
            <Coins className="w-4 h-4 text-[#CCFF00]" />
            {t('currency')}: {CURRENCY_CONFIG[currency].flag} {currency}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
            {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setCurrency(key as Currency)}
                className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2"
              >
                {currency === key && <Check className="w-3 h-3 text-[#CCFF00]" />}
                <span className={currency !== key ? 'ml-5' : ''}>{config.flag} {key}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

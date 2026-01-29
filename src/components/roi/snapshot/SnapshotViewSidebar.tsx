import { useState } from 'react';
import { Mail, Phone, Calendar, Eye, FileImage, FileText, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

interface BrokerProfile {
  fullName: string | null;
  avatarUrl: string | null;
  businessEmail: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
}

interface QuoteInfo {
  projectName: string | null;
  createdAt: string | null;
  viewCount: number;
}

interface SnapshotViewSidebarProps {
  brokerProfile: BrokerProfile;
  quoteInfo: QuoteInfo;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  language: 'en' | 'es';
  setLanguage: (language: 'en' | 'es') => void;
  onExportPDF: () => void;
  onExportPNG: () => void;
  exporting?: boolean;
}

// Shared sidebar content component
const SidebarContent = ({
  brokerProfile,
  quoteInfo,
  currency,
  setCurrency,
  language,
  setLanguage,
  onExportPDF,
  onExportPNG,
  exporting = false,
  showLogo = true,
}: SnapshotViewSidebarProps & { showLogo?: boolean }) => {
  const whatsappLink = brokerProfile.whatsappNumber
    ? `https://wa.me/${brokerProfile.whatsappCountryCode?.replace('+', '')}${brokerProfile.whatsappNumber}`
    : null;

  const emailLink = brokerProfile.businessEmail
    ? `mailto:${brokerProfile.businessEmail}`
    : null;

  const initials = brokerProfile.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IA';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      {showLogo && (
        <div className="p-4 border-b border-theme-border">
          <AppLogo />
        </div>
      )}

      {/* Broker Profile */}
      <div className="p-4 border-b border-theme-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-theme-accent/20">
            <AvatarImage src={brokerProfile.avatarUrl || undefined} alt={brokerProfile.fullName || 'Advisor'} />
            <AvatarFallback className="bg-theme-accent/10 text-theme-accent font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-theme-text truncate">
              {brokerProfile.fullName || 'Investment Advisor'}
            </p>
            <p className="text-xs text-theme-text-muted">
              {language === 'es' ? 'Asesor de Inversiones' : 'Investment Advisor'}
            </p>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="flex gap-2">
          {emailLink && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 h-8 text-xs border-theme-border hover:bg-theme-bg"
            >
              <a href={emailLink}>
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Email
              </a>
            </Button>
          )}
          {whatsappLink && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 h-8 text-xs border-theme-border hover:bg-theme-bg"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Quote Info */}
      <div className="p-4 border-b border-theme-border">
        <h3 className="text-xs font-medium text-theme-text-muted uppercase tracking-wider mb-3">
          {language === 'es' ? 'Información de la Cotización' : 'Quote Information'}
        </h3>
        <div className="space-y-2 text-sm">
          {quoteInfo.projectName && (
            <div className="flex items-center gap-2 text-theme-text">
              <span className="font-medium truncate">{quoteInfo.projectName}</span>
            </div>
          )}
          {quoteInfo.createdAt && (
            <div className="flex items-center gap-2 text-theme-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(quoteInfo.createdAt), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-theme-text-muted">
            <Eye className="w-3.5 h-3.5" />
            <span>{quoteInfo.viewCount} {quoteInfo.viewCount === 1 ? 'view' : 'views'}</span>
          </div>
        </div>
      </div>

      {/* Currency & Language */}
      <div className="p-4 border-b border-theme-border">
        <h3 className="text-xs font-medium text-theme-text-muted uppercase tracking-wider mb-3">
          {language === 'es' ? 'Preferencias' : 'Preferences'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-theme-text-muted mb-1.5 block">
              {language === 'es' ? 'Moneda de Referencia' : 'Reference Currency'}
            </label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">
                <SelectValue placeholder="Select currency">
                  {CURRENCY_CONFIG[currency].flag} {currency}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border z-[100]">
                {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
                  <SelectItem key={c} value={c} className="text-theme-text hover:bg-theme-card-alt">
                    {CURRENCY_CONFIG[c].flag} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-theme-text-muted mb-1.5 block">
              {language === 'es' ? 'Idioma' : 'Language'}
            </label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es')}>
              <SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">
                <SelectValue placeholder="Select language">
                  {language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border z-[100]">
                <SelectItem value="en" className="text-theme-text hover:bg-theme-card-alt">🇬🇧 English</SelectItem>
                <SelectItem value="es" className="text-theme-text hover:bg-theme-card-alt">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="p-4 border-b border-theme-border">
        <h3 className="text-xs font-medium text-theme-text-muted uppercase tracking-wider mb-3">
          {language === 'es' ? 'Descargar' : 'Download'}
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={exporting}
            className="w-full h-9 justify-start border-theme-border hover:bg-theme-bg"
          >
            <FileText className="w-4 h-4 mr-2 text-red-400" />
            {language === 'es' ? 'Descargar PDF' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPNG}
            disabled={exporting}
            className="w-full h-9 justify-start border-theme-border hover:bg-theme-bg"
          >
            <FileImage className="w-4 h-4 mr-2 text-blue-400" />
            {language === 'es' ? 'Descargar PNG' : 'Download PNG'}
          </Button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-4 border-t border-theme-border">
        <p className="text-xs text-theme-text-muted text-center">
          Powered by <span className="text-theme-accent font-medium">DBX Prime</span>
        </p>
      </div>
    </div>
  );
};

export const SnapshotViewSidebar = (props: SnapshotViewSidebarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, currency, setCurrency, setLanguage } = props;

  return (
    <>
      {/* Mobile Header - visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-theme-card border-b border-theme-border">
        <div className="flex items-center justify-between p-3 h-14">
          <AppLogo />
          <div className="flex items-center gap-2">
            {/* Quick currency selector */}
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="w-20 h-8 bg-theme-card-alt border-theme-border text-theme-text text-xs">
                <SelectValue>
                  {CURRENCY_CONFIG[currency].flag} {currency}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border z-[100]">
                {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
                  <SelectItem key={c} value={c} className="text-theme-text hover:bg-theme-card-alt">
                    {CURRENCY_CONFIG[c].flag} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Quick language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="h-8 px-2 text-xs"
            >
              {language === 'en' ? '🇪🇸' : '🇬🇧'}
            </Button>
            
            {/* Menu button */}
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} className="h-8 px-2">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 bg-theme-card border-theme-border p-0">
          <SidebarContent {...props} showLogo={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex w-72 h-screen bg-theme-card border-r border-theme-border flex-col shrink-0 sticky top-0">
        <SidebarContent {...props} />
      </aside>
    </>
  );
};

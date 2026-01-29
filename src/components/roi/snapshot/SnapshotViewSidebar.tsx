import { Mail, Phone, Calendar, Eye, Download, FileImage, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppLogo } from '@/components/AppLogo';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export const SnapshotViewSidebar = ({
  brokerProfile,
  quoteInfo,
  currency,
  setCurrency,
  language,
  setLanguage,
  onExportPDF,
  onExportPNG,
  exporting = false,
}: SnapshotViewSidebarProps) => {
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
    <aside className="w-72 h-screen bg-theme-card border-r border-theme-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-theme-border">
        <AppLogo />
      </div>

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
              <SelectTrigger className="w-full h-9 bg-theme-bg border-theme-border">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{CURRENCY_CONFIG[currency].flag}</span>
                    <span>{currency}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span>{CURRENCY_CONFIG[c].flag}</span>
                      <span>{c}</span>
                    </span>
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
              <SelectTrigger className="w-full h-9 bg-theme-bg border-theme-border">
                <SelectValue>{language === 'en' ? 'English' : 'Español'}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
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
    </aside>
  );
};

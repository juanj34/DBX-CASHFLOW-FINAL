import { useState, useMemo, useCallback } from "react";
import { 
  FileText, Copy, Check, Edit3, RotateCcw, ChevronDown, ChevronRight,
  Home, CreditCard, Calendar, Banknote, Building2, Key, TrendingUp, DoorOpen, Landmark,
  LayoutList, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs, OICalculations } from "./useOICalculations";
import { ClientUnitData } from "./ClientUnitInfo";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { generateCashflowSummary, StructuredSummaryData } from "./cashflowSummaryGenerator";
import { toast } from "sonner";

interface SummaryToggles {
  showExit: boolean;
  showRental: boolean;
  showMortgage: boolean;
}

interface CashflowSummaryCardProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: OICalculations;
  mortgageAnalysis?: MortgageAnalysis;
  mortgageInputs?: MortgageInputs;
  exitScenarios?: number[];
  currency: Currency;
  rate: number;
  className?: string;
  showExitScenarios?: boolean;
  showRentalPotential?: boolean;
  showMortgageAnalysis?: boolean;
  onToggleChange?: (toggles: SummaryToggles) => void;
  readOnly?: boolean;
  defaultOpen?: boolean;
}

// Section component for consistent styling
const SummarySection = ({ 
  icon: Icon, 
  iconColor, 
  title, 
  children 
}: { 
  icon: React.ElementType; 
  iconColor: string; 
  title: string; 
  children: React.ReactNode;
}) => (
  <div className="py-3 sm:py-4 first:pt-0 last:pb-0 border-b border-theme-border last:border-b-0">
    <div className="flex items-center gap-2 mb-2 sm:mb-3">
      <Icon className={cn("w-4 h-4", iconColor)} />
      <h4 className="text-xs sm:text-sm font-semibold text-theme-text">{title}</h4>
    </div>
    <div className="space-y-1.5 sm:space-y-2 pl-5 sm:pl-6">
      {children}
    </div>
  </div>
);

// Row component for label/value pairs - optimized for mobile
const SummaryRow = ({ 
  label, 
  value, 
  highlight = false,
  subtext
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  subtext?: string;
}) => (
  <div className="flex items-center justify-between gap-2 min-w-0">
    <span className="text-[10px] sm:text-xs text-theme-text-muted shrink-0">{label}</span>
    <div className="text-right whitespace-nowrap min-w-0">
      <span className={cn(
        "text-xs sm:text-sm font-mono",
        highlight ? "text-theme-accent font-semibold" : "text-theme-text"
      )}>
        {value}
      </span>
      {subtext && <span className="text-[9px] sm:text-xs text-theme-text-muted ml-1">{subtext}</span>}
    </div>
  </div>
);

export const CashflowSummaryCard = ({
  inputs,
  clientInfo,
  calculations,
  mortgageAnalysis,
  mortgageInputs,
  exitScenarios,
  currency,
  rate,
  className,
  showExitScenarios = true,
  showRentalPotential = true,
  showMortgageAnalysis = true,
  onToggleChange,
  readOnly = false,
  defaultOpen = false,
}: CashflowSummaryCardProps) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localToggles, setLocalToggles] = useState({
    showExit: showExitScenarios,
    showRental: showRentalPotential,
    showMortgage: showMortgageAnalysis,
  });
  const [viewMode, setViewMode] = useState<'structured' | 'conversational'>('structured');

  const isMortgageEnabled = mortgageInputs?.enabled ?? false;
  const fmt = useCallback((amount: number) => formatCurrency(amount, currency, rate), [currency, rate]);

  // Generate the summary with current toggle values
  const generatedSummary = useMemo(() => {
    return generateCashflowSummary({
      inputs,
      clientInfo,
      calculations,
      mortgageAnalysis,
      mortgageInputs,
      exitScenarios,
      currency,
      rate,
      language: language as 'en' | 'es',
      includeExitScenarios: localToggles.showExit,
      includeRentalPotential: localToggles.showRental,
      includeMortgage: localToggles.showMortgage,
    });
  }, [inputs, clientInfo, calculations, mortgageAnalysis, mortgageInputs, exitScenarios, currency, rate, language, localToggles]);

  const { structuredData } = generatedSummary;
  const displayText = editedText ?? generatedSummary.fullText;

  const handleToggleChange = (key: 'showExit' | 'showRental' | 'showMortgage', value: boolean) => {
    const newToggles = { ...localToggles, [key]: value };
    setLocalToggles(newToggles);
    onToggleChange?.(newToggles);
    // Reset edited text when toggles change
    setEditedText(null);
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      toast.success(t('copiedToClipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [displayText, t]);

  const handleEdit = () => {
    if (!isEditing) {
      setEditedText(displayText);
    }
    setIsEditing(!isEditing);
  };

  const handleReset = () => {
    setEditedText(null);
    setIsEditing(false);
  };

  const hasEdits = editedText !== null && editedText !== generatedSummary.fullText;

  return (
    <div className={cn("mb-6", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-theme-card/80 transition-colors group"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-theme-accent/10 rounded-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-theme-accent" />
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-base font-semibold text-theme-text">{t('summaryTitle')}</h3>
            <p className="text-[10px] sm:text-xs text-theme-text-muted mt-0.5 hidden sm:block">{t('summarySubtitle')}</p>
          </div>
          {hasEdits && (
            <span className="text-[10px] sm:text-xs bg-amber-500/20 text-amber-400 px-1.5 sm:px-2 py-0.5 rounded">
              {t('edited')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-theme-text-muted hidden sm:inline">
            {isOpen ? t('clickToCollapse') : t('clickToExpand')}
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-theme-text-muted group-hover:text-theme-text transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-theme-text-muted group-hover:text-theme-text transition-colors" />
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[3000px] opacity-100 mt-3 sm:mt-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-3 sm:p-6">
          {/* Toggle controls - only visible when not readOnly */}
          {!readOnly && (
            <div className="mb-4 pb-4 border-b border-theme-border">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setViewMode('structured')}
                  className={cn(
                    "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors",
                    viewMode === 'structured' 
                      ? "bg-theme-accent/20 text-theme-accent" 
                      : "bg-theme-card text-theme-text-muted hover:text-theme-text"
                  )}
                >
                  <LayoutList className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {t('dataView')}
                </button>
                <button
                  onClick={() => setViewMode('conversational')}
                  className={cn(
                    "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors",
                    viewMode === 'conversational' 
                      ? "bg-theme-accent/20 text-theme-accent" 
                      : "bg-theme-card text-theme-text-muted hover:text-theme-text"
                  )}
                >
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {t('explanationView')}
                </button>
              </div>
              
              <p className="text-[10px] sm:text-xs text-theme-text-muted mb-3">{t('sectionsToInclude')}</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-rental"
                    checked={localToggles.showRental}
                    onCheckedChange={(checked) => handleToggleChange('showRental', checked)}
                    className="data-[state=checked]:bg-theme-accent scale-90 sm:scale-100"
                  />
                  <Label htmlFor="toggle-rental" className="text-[10px] sm:text-sm text-theme-text-muted cursor-pointer">
                    {t('includeRentalAnalysis')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-exit"
                    checked={localToggles.showExit}
                    onCheckedChange={(checked) => handleToggleChange('showExit', checked)}
                    className="data-[state=checked]:bg-theme-accent scale-90 sm:scale-100"
                  />
                  <Label htmlFor="toggle-exit" className="text-[10px] sm:text-sm text-theme-text-muted cursor-pointer">
                    {t('includeExitScenarios')}
                  </Label>
                </div>
                {/* Mortgage Toggle - Only show if mortgage is enabled */}
                {isMortgageEnabled && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="toggle-mortgage"
                      checked={localToggles.showMortgage}
                      onCheckedChange={(checked) => handleToggleChange('showMortgage', checked)}
                      className="data-[state=checked]:bg-theme-accent scale-90 sm:scale-100"
                    />
                    <Label htmlFor="toggle-mortgage" className="text-[10px] sm:text-sm text-theme-text-muted cursor-pointer">
                      {t('includeMortgageAnalysis')}
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 mb-4">
            {hasEdits && !readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-400 hover:text-white h-7 sm:h-8 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">{t('resetSummary')}</span>
              </Button>
            )}
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className={cn(
                  "h-7 sm:h-8 px-2 text-xs",
                  isEditing ? "text-[#CCFF00]" : "text-gray-400 hover:text-white"
                )}
              >
                <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">{isEditing ? t('doneEditing') : t('editSummary')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white h-7 sm:h-8 px-2 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
                  <span className="text-green-500">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">{t('copyToClipboard')}</span>
                  <span className="sm:hidden">{t('copy')}</span>
                </>
              )}
            </Button>
          </div>

          {/* Summary content */}
          {isEditing ? (
            <Textarea
              value={editedText || ''}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[400px] bg-theme-card border-theme-border text-theme-text font-mono text-xs sm:text-sm leading-relaxed resize-y"
              placeholder="Edit summary..."
            />
          ) : viewMode === 'conversational' ? (
            /* Conversational View - Narrative explanations */
            <div className="space-y-6 text-sm leading-relaxed">
              {/* Property Introduction */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#CCFF00] font-semibold">
                  <Home className="w-4 h-4" />
                  <span>{language === 'en' ? "Let's talk about this property" : "Hablemos de esta propiedad"}</span>
                </div>
                <p className="text-gray-300">
                  {language === 'en' 
                    ? `We're looking at ${structuredData.property.projectName} by ${structuredData.property.developer}. It's a ${structuredData.property.unitType || 'unit'} with ${structuredData.property.sizeSqft.toLocaleString()} sqft, priced at ${fmt(structuredData.property.price)}${structuredData.property.pricePerSqft > 0 ? ` – that's ${fmt(structuredData.property.pricePerSqft)} per sqft` : ''}.`
                    : `Estamos viendo ${structuredData.property.projectName} de ${structuredData.property.developer}. Es un ${structuredData.property.unitType || 'unidad'} de ${structuredData.property.sizeSqft.toLocaleString()} sqft, con precio de ${fmt(structuredData.property.price)}${structuredData.property.pricePerSqft > 0 ? ` – es decir ${fmt(structuredData.property.pricePerSqft)} por sqft` : ''}.`
                  }
                </p>
              </div>

              {/* Payment Plan Explanation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'en' ? "Here's how the money flows" : "Así fluye el dinero"}</span>
                </div>
                <p className="text-gray-300">
                  {language === 'en'
                    ? `This is a ${structuredData.paymentStructure.preHandoverPercent}/${structuredData.paymentStructure.handoverPercent} payment plan. You pay ${structuredData.paymentStructure.preHandoverPercent}% before handover and the remaining ${structuredData.paymentStructure.handoverPercent}% when you get the keys.`
                    : `Este es un plan de pago ${structuredData.paymentStructure.preHandoverPercent}/${structuredData.paymentStructure.handoverPercent}. Pagas ${structuredData.paymentStructure.preHandoverPercent}% antes de la entrega y el ${structuredData.paymentStructure.handoverPercent}% restante cuando recibas las llaves.`
                  }
                </p>
                <div className="bg-[#1a1f2e] rounded-lg p-3 space-y-1">
                  {structuredData.paymentStructure.installments.map((inst, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-400">{inst.percent}% – {inst.label}</span>
                      <span className="text-white font-mono">{fmt(inst.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Commitment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Banknote className="w-4 h-4" />
                  <span>{language === 'en' ? "What you need to secure this today" : "Lo que necesitas para asegurar esto hoy"}</span>
                </div>
                <p className="text-gray-300">
                  {language === 'en'
                    ? `To lock in this property today, you'll need ${fmt(structuredData.todaysCommitment.total)}. This covers your downpayment of ${fmt(structuredData.todaysCommitment.downpayment)} (${structuredData.todaysCommitment.downpaymentPercent}%), plus the DLD fee of ${fmt(structuredData.todaysCommitment.dldFee)} and Oqood fee of ${fmt(structuredData.todaysCommitment.oqoodFee)}.`
                    : `Para asegurar esta propiedad hoy, necesitarás ${fmt(structuredData.todaysCommitment.total)}. Esto cubre tu enganche de ${fmt(structuredData.todaysCommitment.downpayment)} (${structuredData.todaysCommitment.downpaymentPercent}%), más la tarifa DLD de ${fmt(structuredData.todaysCommitment.dldFee)} y la tarifa Oqood de ${fmt(structuredData.todaysCommitment.oqoodFee)}.`
                  }
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>{language === 'en' ? "The timeline" : "El cronograma"}</span>
                </div>
                <p className="text-gray-300">
                  {language === 'en'
                    ? `From booking in ${structuredData.timeline.bookingDate} to handover in ${structuredData.timeline.handoverDate}, that's about ${structuredData.timeline.constructionMonths} months of construction.`
                    : `Desde la reserva en ${structuredData.timeline.bookingDate} hasta la entrega en ${structuredData.timeline.handoverDate}, son aproximadamente ${structuredData.timeline.constructionMonths} meses de construcción.`
                  }
                </p>
              </div>

              {/* During Construction */}
              {structuredData.construction.paymentsCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 font-semibold">
                    <Building2 className="w-4 h-4" />
                    <span>{language === 'en' ? "During construction" : "Durante la construcción"}</span>
                  </div>
                  <p className="text-gray-300">
                    {language === 'en'
                      ? `During the construction period, you'll make ${structuredData.construction.paymentsCount} additional payment${structuredData.construction.paymentsCount > 1 ? 's' : ''} totaling ${fmt(structuredData.construction.totalAmount)}.`
                      : `Durante el período de construcción, realizarás ${structuredData.construction.paymentsCount} pago${structuredData.construction.paymentsCount > 1 ? 's' : ''} adicional${structuredData.construction.paymentsCount > 1 ? 'es' : ''} por un total de ${fmt(structuredData.construction.totalAmount)}.`
                    }
                  </p>
                </div>
              )}

              {/* Handover */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <Key className="w-4 h-4" />
                  <span>{language === 'en' ? "At handover" : "En la entrega"}</span>
                </div>
                <p className="text-gray-300">
                  {language === 'en'
                    ? `When you receive the keys, you'll pay the remaining ${structuredData.handover.percent}% – that's ${fmt(structuredData.handover.amount)}.`
                    : `Cuando recibas las llaves, pagarás el ${structuredData.handover.percent}% restante – es decir ${fmt(structuredData.handover.amount)}.`
                  }
                </p>
              </div>

              {/* Rental Potential */}
              {localToggles.showRental && structuredData.rental && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span>{language === 'en' ? "Rental income potential" : "Potencial de ingreso por renta"}</span>
                  </div>
                  <p className="text-gray-300">
                    {language === 'en'
                      ? `Based on a ${structuredData.rental.yieldPercent}% rental yield, this property could generate ${fmt(structuredData.rental.grossAnnual)} in gross annual rent. After service charges, you'd net ${fmt(structuredData.rental.netAnnual)} per year – that's about ${fmt(structuredData.rental.netAnnual / 12)} monthly. At this rate, the property pays for itself in roughly ${structuredData.rental.yearsToPayOff.toFixed(1)} years.`
                      : `Basado en un rendimiento de ${structuredData.rental.yieldPercent}%, esta propiedad podría generar ${fmt(structuredData.rental.grossAnnual)} en renta bruta anual. Después de cargos de servicio, tendrías ${fmt(structuredData.rental.netAnnual)} neto por año – aproximadamente ${fmt(structuredData.rental.netAnnual / 12)} mensual. A este ritmo, la propiedad se paga sola en aproximadamente ${structuredData.rental.yearsToPayOff.toFixed(1)} años.`
                    }
                  </p>
                  {/* Airbnb Comparison */}
                  {structuredData.rental.showAirbnb && structuredData.rental.airbnbNetAnnual && structuredData.rental.airbnbNetAnnual > 0 && (
                    <div className="bg-[#1a1f2e] rounded-lg p-3 mt-2">
                      <p className="text-gray-300">
                        {language === 'en'
                          ? `If you're open to short-term rentals via Airbnb, the numbers could be even better. You could potentially earn ${fmt(structuredData.rental.airbnbNetAnnual)} net annually${structuredData.rental.airbnbDifference && structuredData.rental.airbnbDifference > 0 ? ` – that's ${((structuredData.rental.airbnbDifference / structuredData.rental.netAnnual) * 100).toFixed(0)}% more than long-term rental` : ''}.`
                          : `Si estás abierto a rentas cortas vía Airbnb, los números podrían ser mejores. Podrías ganar ${fmt(structuredData.rental.airbnbNetAnnual)} neto anualmente${structuredData.rental.airbnbDifference && structuredData.rental.airbnbDifference > 0 ? ` – eso es ${((structuredData.rental.airbnbDifference / structuredData.rental.netAnnual) * 100).toFixed(0)}% más que renta a largo plazo` : ''}.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Exit Scenarios */}
              {localToggles.showExit && structuredData.exitScenarios && structuredData.exitScenarios.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-pink-400 font-semibold">
                    <DoorOpen className="w-4 h-4" />
                    <span>{language === 'en' ? "Exit opportunities" : "Oportunidades de salida"}</span>
                  </div>
                  <p className="text-gray-300">
                    {language === 'en'
                      ? "If you decide to sell during construction, here are your potential exit points:"
                      : "Si decides vender durante la construcción, estas son tus opciones de salida:"
                    }
                  </p>
                  <div className="bg-[#1a1f2e] rounded-lg p-3 space-y-2">
                    {structuredData.exitScenarios.map((scenario, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="text-gray-400">{language === 'en' ? 'Month' : 'Mes'} {scenario.month}: </span>
                        <span className="text-white">{language === 'en' ? 'Property at' : 'Propiedad en'} {fmt(scenario.value)}, </span>
                        <span className="text-[#CCFF00]">{language === 'en' ? 'profit' : 'ganancia'} {fmt(scenario.profit)} </span>
                        <span className="text-gray-400">({scenario.roe.toFixed(1)}% ROE)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mortgage */}
              {localToggles.showMortgage && structuredData.mortgage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <Landmark className="w-4 h-4" />
                    <span>{language === 'en' ? "Mortgage financing" : "Financiamiento hipotecario"}</span>
                  </div>
                  <p className="text-gray-300">
                    {structuredData.mortgage.isPositive
                      ? (language === 'en'
                          ? `Good news on financing! With ${structuredData.mortgage.financingPercent}% mortgage (${fmt(structuredData.mortgage.loanAmount)}), your monthly payment would be ${fmt(structuredData.mortgage.monthlyPayment)}. The expected rent of ${fmt(structuredData.mortgage.monthlyRent)} covers this completely, leaving you with ${fmt(structuredData.mortgage.monthlyContribution)} extra each month. The property essentially pays for itself.`
                          : `¡Buenas noticias sobre financiamiento! Con ${structuredData.mortgage.financingPercent}% de hipoteca (${fmt(structuredData.mortgage.loanAmount)}), tu pago mensual sería ${fmt(structuredData.mortgage.monthlyPayment)}. La renta esperada de ${fmt(structuredData.mortgage.monthlyRent)} cubre esto completamente, dejándote ${fmt(structuredData.mortgage.monthlyContribution)} extra cada mes. La propiedad esencialmente se paga sola.`
                        )
                      : (language === 'en'
                          ? `With ${structuredData.mortgage.financingPercent}% mortgage (${fmt(structuredData.mortgage.loanAmount)}), your monthly payment would be ${fmt(structuredData.mortgage.monthlyPayment)}. The expected rent of ${fmt(structuredData.mortgage.monthlyRent)} covers most of it, but you'd need to contribute ${fmt(structuredData.mortgage.monthlyContribution)} monthly from your own pocket. Think of it as forced savings – you're building equity while the tenant covers most of the cost.`
                          : `Con ${structuredData.mortgage.financingPercent}% de hipoteca (${fmt(structuredData.mortgage.loanAmount)}), tu pago mensual sería ${fmt(structuredData.mortgage.monthlyPayment)}. La renta esperada de ${fmt(structuredData.mortgage.monthlyRent)} cubre la mayor parte, pero necesitarías aportar ${fmt(structuredData.mortgage.monthlyContribution)} mensualmente de tu bolsillo. Piénsalo como ahorro forzado – estás construyendo capital mientras el inquilino cubre la mayor parte del costo.`
                        )
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Structured View - Data tables */
            <div className="space-y-0">
              {/* Property Overview */}
              <SummarySection icon={Home} iconColor="text-theme-accent" title={t('propertyOverviewSection')}>
                <SummaryRow label={t('projectLabel')} value={`${structuredData.property.projectName}`} />
                <SummaryRow label={t('developer')} value={structuredData.property.developer} />
                <SummaryRow label={t('unit')} value={`${structuredData.property.unit} (${structuredData.property.unitType})`} />
                <SummaryRow label={t('size')} value={`${structuredData.property.sizeSqft.toLocaleString()} sqft`} />
                <SummaryRow 
                  label={t('purchasePrice')} 
                  value={fmt(structuredData.property.price)} 
                  highlight 
                  subtext={structuredData.property.pricePerSqft > 0 ? `(${fmt(structuredData.property.pricePerSqft)}/sqft)` : undefined}
                />
              </SummarySection>

              {/* Payment Structure with Installments */}
              <SummarySection icon={CreditCard} iconColor="text-cyan-400" title={t('paymentStructureSection')}>
                <div className="mb-2">
                  <SummaryRow 
                    label={t('paymentPlan')} 
                    value={`${structuredData.paymentStructure.preHandoverPercent}/${structuredData.paymentStructure.handoverPercent}`} 
                    highlight
                  />
                </div>
                <div className="border-t border-theme-border/50 pt-2 mt-2">
                  <p className="text-[10px] sm:text-xs text-theme-text-muted mb-2">{t('installmentBreakdown') || 'Breakdown by installment:'}</p>
                  {structuredData.paymentStructure.installments.map((inst, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 py-1 border-b border-theme-border/30 last:border-b-0">
                      <span className="text-[10px] sm:text-xs text-theme-text-muted shrink-0">
                        {inst.percent}% – {inst.label}
                      </span>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-mono text-theme-text">{fmt(inst.amount)}</span>
                        <span className="text-[9px] sm:text-xs text-theme-text-muted ml-1">({inst.timing})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SummarySection>

              {/* Timeline */}
              <SummarySection icon={Calendar} iconColor="text-purple-400" title={t('timelineSection')}>
                <SummaryRow label={t('bookingDate')} value={structuredData.timeline.bookingDate} />
                <SummaryRow label={t('handoverDateLabel')} value={structuredData.timeline.handoverDate} />
                <SummaryRow label={t('constructionPeriod')} value={`${structuredData.timeline.constructionMonths} ${t('months')}`} highlight />
              </SummarySection>

              {/* Today's Commitment */}
              <SummarySection icon={Banknote} iconColor="text-amber-400" title={t('todaysCommitmentSection')}>
                <SummaryRow 
                  label={t('downpayment')} 
                  value={fmt(structuredData.todaysCommitment.downpayment)} 
                  subtext={`(${structuredData.todaysCommitment.downpaymentPercent}%)`}
                />
                <SummaryRow label={t('dldFeePercent')} value={fmt(structuredData.todaysCommitment.dldFee)} />
                <SummaryRow label={t('oqoodFee')} value={fmt(structuredData.todaysCommitment.oqoodFee)} />
                <div className="pt-2 mt-2 border-t border-theme-border/50">
                  <SummaryRow label={t('totalToday')} value={fmt(structuredData.todaysCommitment.total)} highlight />
                </div>
              </SummarySection>

              {/* During Construction */}
              <SummarySection icon={Building2} iconColor="text-gray-400" title={t('duringConstructionSection')}>
                {structuredData.construction.paymentsCount > 0 ? (
                  <>
                    <SummaryRow label={t('additionalPayments')} value={`${structuredData.construction.paymentsCount}`} />
                    {structuredData.construction.payments.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 py-1">
                        <span className="text-[10px] sm:text-xs text-theme-text-muted">{p.percent}% at {p.timing}</span>
                        <span className="text-xs sm:text-sm font-mono text-theme-text">{fmt(p.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-theme-border/50">
                      <SummaryRow label={t('total')} value={fmt(structuredData.construction.totalAmount)} highlight />
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] sm:text-xs text-theme-text-muted italic">{t('noAdditionalPaymentsMsg')}</p>
                )}
              </SummarySection>

              {/* At Handover */}
              <SummarySection icon={Key} iconColor="text-cyan-400" title={t('atHandoverSection')}>
                <SummaryRow 
                  label={t('finalPayment')} 
                  value={fmt(structuredData.handover.amount)} 
                  highlight 
                  subtext={`(${structuredData.handover.percent}%)`}
                />
              </SummarySection>

              {/* Rental Potential - Conditional */}
              {localToggles.showRental && structuredData.rental && (
                <SummarySection icon={TrendingUp} iconColor="text-green-400" title={t('rentalPotentialSection')}>
                  <SummaryRow label={t('rentalYield')} value={`${structuredData.rental.yieldPercent}%`} />
                  <SummaryRow label={t('grossAnnualRent')} value={fmt(structuredData.rental.grossAnnual)} />
                  <SummaryRow label={t('netAnnualRent')} value={fmt(structuredData.rental.netAnnual)} highlight />
                  <SummaryRow label={t('yearsToPayOff')} value={structuredData.rental.yearsToPayOff.toFixed(1)} />
                  <SummaryRow label={t('effectiveYield')} value={`${structuredData.rental.effectiveYield.toFixed(1)}%`} highlight />
                  
                  {/* Airbnb Comparison */}
                  {structuredData.rental.showAirbnb && structuredData.rental.airbnbNetAnnual && structuredData.rental.airbnbNetAnnual > 0 && (
                    <div className="pt-2 mt-2 border-t border-[#2a3142]/50">
                      <p className="text-xs text-gray-500 mb-2">{t('airbnbComparison')}</p>
                      <SummaryRow label={t('airbnbNet')} value={fmt(structuredData.rental.airbnbNetAnnual)} />
                      {structuredData.rental.airbnbDifference !== undefined && (
                        <SummaryRow 
                          label={t('comparedToLongTerm')} 
                          value={`${structuredData.rental.airbnbDifference >= 0 ? '+' : ''}${fmt(structuredData.rental.airbnbDifference)}`}
                          highlight={structuredData.rental.airbnbDifference > 0}
                        />
                      )}
                    </div>
                  )}
                </SummarySection>
              )}

              {/* Exit Scenarios - Conditional */}
              {localToggles.showExit && structuredData.exitScenarios && structuredData.exitScenarios.length > 0 && (
                <SummarySection icon={DoorOpen} iconColor="text-pink-400" title={t('exitOptionsSection')}>
                  {structuredData.exitScenarios.map((scenario, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 border-b border-[#2a3142]/30 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400">{t('monthLabel')} {scenario.month}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500">{t('value')}</span>
                          <p className="text-white font-mono">{fmt(scenario.value)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('profit')}</span>
                          <p className="text-[#CCFF00] font-mono">{fmt(scenario.profit)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('roe')}</span>
                          <p className="text-white font-mono">{scenario.roe.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </SummarySection>
              )}

              {/* Mortgage Analysis - Conditional */}
              {localToggles.showMortgage && structuredData.mortgage && (
                <SummarySection icon={Landmark} iconColor="text-blue-400" title={t('mortgageSection')}>
                  <SummaryRow label={t('financing')} value={`${structuredData.mortgage.financingPercent}%`} />
                  <SummaryRow label={t('loanAmount')} value={fmt(structuredData.mortgage.loanAmount)} />
                  <SummaryRow label={t('monthlyPayment')} value={fmt(structuredData.mortgage.monthlyPayment)} />
                  <SummaryRow label={t('monthlyRent')} value={fmt(structuredData.mortgage.monthlyRent)} />
                  <div className="pt-2 mt-2 border-t border-[#2a3142]/50">
                    <SummaryRow 
                      label={structuredData.mortgage.isPositive ? t('surplus') : t('monthlyContribution')} 
                      value={`${structuredData.mortgage.isPositive ? '+' : '-'}${fmt(structuredData.mortgage.monthlyContribution)}`} 
                      highlight 
                    />
                    <p className={cn(
                      "text-xs mt-1",
                      structuredData.mortgage.isPositive ? "text-green-400" : "text-amber-400"
                    )}>
                      {structuredData.mortgage.isPositive ? '✅ ' + t('mortgageCovered') : '⚠️ ' + t('contributionRequired')}
                    </p>
                  </div>
                </SummarySection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

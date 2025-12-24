import { useState, useMemo, useCallback } from "react";
import { 
  FileText, Copy, Check, Edit3, RotateCcw, ChevronDown, ChevronRight,
  Home, CreditCard, Calendar, Banknote, Building2, Key, TrendingUp, DoorOpen, Landmark
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
  <div className="py-4 first:pt-0 last:pb-0 border-b border-[#2a3142] last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
      <h4 className="text-sm sm:text-base font-semibold text-white">{title}</h4>
    </div>
    <div className="space-y-2 pl-6 sm:pl-7">
      {children}
    </div>
  </div>
);

// Row component for label/value pairs
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
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4">
    <span className="text-xs sm:text-sm text-gray-400">{label}</span>
    <div className="text-right sm:text-right">
      <span className={cn(
        "text-sm sm:text-base font-mono",
        highlight ? "text-[#CCFF00] font-semibold" : "text-white"
      )}>
        {value}
      </span>
      {subtext && <span className="text-xs text-gray-500 ml-1">{subtext}</span>}
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
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#1a1f2e] border border-[#2a3142] rounded-xl hover:bg-[#1a1f2e]/80 transition-colors group"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-[#CCFF00]/10 rounded-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCFF00]" />
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-base font-semibold text-white">{t('summaryTitle')}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">{t('summarySubtitle')}</p>
          </div>
          {hasEdits && (
            <span className="text-[10px] sm:text-xs bg-amber-500/20 text-amber-400 px-1.5 sm:px-2 py-0.5 rounded">
              {t('edited')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
            {isOpen ? t('clickToCollapse') : t('clickToExpand')}
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[3000px] opacity-100 mt-3 sm:mt-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-[#0d1117] border border-[#2a3142] rounded-xl p-3 sm:p-6">
          {/* Toggle controls - only visible when not readOnly */}
          {!readOnly && (
            <div className="mb-4 pb-4 border-b border-[#2a3142]">
              <p className="text-xs text-gray-500 mb-3">{t('sectionsToInclude')}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-rental"
                    checked={localToggles.showRental}
                    onCheckedChange={(checked) => handleToggleChange('showRental', checked)}
                    className="data-[state=checked]:bg-[#CCFF00]"
                  />
                  <Label htmlFor="toggle-rental" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                    {t('includeRentalAnalysis')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-exit"
                    checked={localToggles.showExit}
                    onCheckedChange={(checked) => handleToggleChange('showExit', checked)}
                    className="data-[state=checked]:bg-[#CCFF00]"
                  />
                  <Label htmlFor="toggle-exit" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
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
                      className="data-[state=checked]:bg-[#CCFF00]"
                    />
                    <Label htmlFor="toggle-mortgage" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
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
              className="min-h-[400px] bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs sm:text-sm leading-relaxed resize-y"
              placeholder="Edit summary..."
            />
          ) : (
            <div className="space-y-0">
              {/* Property Overview */}
              <SummarySection icon={Home} iconColor="text-[#CCFF00]" title={t('propertyOverviewSection')}>
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
                <div className="border-t border-[#2a3142]/50 pt-2 mt-2">
                  <p className="text-xs text-gray-500 mb-2">{t('installmentBreakdown') || 'Breakdown by installment:'}</p>
                  {structuredData.paymentStructure.installments.map((inst, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1 border-b border-[#2a3142]/30 last:border-b-0">
                      <span className="text-xs text-gray-400">
                        {inst.percent}% – {inst.label}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-mono text-white">{fmt(inst.amount)}</span>
                        <span className="text-xs text-gray-500 ml-1">({inst.timing})</span>
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
                <div className="pt-2 mt-2 border-t border-[#2a3142]/50">
                  <SummaryRow label={t('totalToday')} value={fmt(structuredData.todaysCommitment.total)} highlight />
                </div>
              </SummarySection>

              {/* During Construction */}
              <SummarySection icon={Building2} iconColor="text-gray-400" title={t('duringConstructionSection')}>
                {structuredData.construction.paymentsCount > 0 ? (
                  <>
                    <SummaryRow label={t('additionalPayments')} value={`${structuredData.construction.paymentsCount}`} />
                    {structuredData.construction.payments.map((p, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1">
                        <span className="text-xs text-gray-500">{p.percent}% at {p.timing}</span>
                        <span className="text-sm font-mono text-white">{fmt(p.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-[#2a3142]/50">
                      <SummaryRow label={t('total')} value={fmt(structuredData.construction.totalAmount)} highlight />
                    </div>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 italic">{t('noAdditionalPaymentsMsg')}</p>
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
                      label={structuredData.mortgage.isPositive ? t('surplus') : t('gap')} 
                      value={`${structuredData.mortgage.isPositive ? '+' : '-'}${fmt(structuredData.mortgage.gap)}`} 
                      highlight 
                    />
                    <p className={cn(
                      "text-xs mt-1",
                      structuredData.mortgage.isPositive ? "text-green-400" : "text-amber-400"
                    )}>
                      {structuredData.mortgage.isPositive ? '✅ ' + t('mortgageCovered') : '⚠️ ' + t('gapRequired')}
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

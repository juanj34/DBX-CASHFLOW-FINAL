import { useState } from "react";
import { Building2, AlertTriangle, TrendingUp, Shield, CreditCard, Calculator, Home, CheckCircle, AlertCircle, Building, Info, ChevronDown, ChevronUp, ArrowRight, DollarSign } from "lucide-react";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { CollapsibleSection } from "./CollapsibleSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SafetyBufferPanel, TenantEquityPanel, StressTestPanel, AmortizationTable } from "./financing";
interface MortgageBreakdownProps {
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  basePrice: number;
  currency: Currency;
  rate: number;
  preHandoverPercent?: number;
  // Rent comparison props
  monthlyLongTermRent?: number;
  monthlyServiceCharges?: number;
  monthlyAirbnbNet?: number;
  showAirbnbComparison?: boolean;
  // Year 5 comparison props
  year5LongTermRent?: number;
  year5AirbnbNet?: number;
  rentGrowthRate?: number;
}

export const MortgageBreakdown = ({
  mortgageInputs,
  mortgageAnalysis,
  basePrice,
  currency,
  rate,
  preHandoverPercent = 30,
  monthlyLongTermRent,
  monthlyServiceCharges,
  monthlyAirbnbNet,
  showAirbnbComparison,
  year5LongTermRent,
  year5AirbnbNet,
  rentGrowthRate = 4,
}: MortgageBreakdownProps) => {
  const { t } = useLanguage();
  const [showLongTermBreakdown, setShowLongTermBreakdown] = useState(false);
  const [showAirbnbBreakdown, setShowAirbnbBreakdown] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [feesOpen, setFeesOpen] = useState(false);

  if (!mortgageInputs.enabled) return null;

  const {
    hasGap,
    gapPercent,
    gapAmount,
    equityRequiredPercent,
    loanAmount,
    monthlyPayment,
    totalLoanPayments,
    processingFee,
    valuationFee,
    mortgageRegistration,
    totalUpfrontFees,
    annualLifeInsurance,
    annualPropertyInsurance,
    totalAnnualInsurance,
    totalInsuranceOverTerm,
    totalInterestAndFees,
    // NEW fields for financing panels
    amortizationSchedule,
    principalPaidYear5,
    principalPaidYear10,
    stressScenarios,
  } = mortgageAnalysis;

  const preHandoverAmount = basePrice * preHandoverPercent / 100;
  const totalBeforeHandover = basePrice * equityRequiredPercent / 100;

  // Calculate rent vs mortgage coverage
  const netMonthlyRent = (monthlyLongTermRent || 0) - (monthlyServiceCharges || 0);
  const monthlyMortgageTotal = monthlyPayment + totalAnnualInsurance / 12;
  const monthlyCashflow = netMonthlyRent - monthlyMortgageTotal;
  const isCovered = monthlyCashflow >= 0;

  // Airbnb cashflow
  const airbnbCashflow = (monthlyAirbnbNet || 0) - monthlyMortgageTotal;
  const isAirbnbCovered = airbnbCashflow >= 0;

  // Coverage percentage calculations
  const longTermCoveragePercent = monthlyMortgageTotal > 0 
    ? Math.round((netMonthlyRent / monthlyMortgageTotal) * 100) 
    : 0;
  const airbnbCoveragePercent = monthlyMortgageTotal > 0 && monthlyAirbnbNet 
    ? Math.round((monthlyAirbnbNet / monthlyMortgageTotal) * 100) 
    : 0;

  // Year 5 calculations
  const year5NetLongTerm = (year5LongTermRent || 0) - (monthlyServiceCharges || 0);
  const year5CoveragePercent = monthlyMortgageTotal > 0 && year5LongTermRent
    ? Math.round((year5NetLongTerm / monthlyMortgageTotal) * 100)
    : 0;
  const year5AirbnbCoveragePercent = monthlyMortgageTotal > 0 && year5AirbnbNet
    ? Math.round((year5AirbnbNet / monthlyMortgageTotal) * 100)
    : 0;
  const rentGrowthPercent = netMonthlyRent > 0 && year5NetLongTerm > 0
    ? Math.round(((year5NetLongTerm - netMonthlyRent) / netMonthlyRent) * 100)
    : 0;

  // Display multiplier for monthly/annual toggle
  const displayMultiplier = viewMode === 'annual' ? 12 : 1;
  const periodLabel = viewMode === 'annual' ? t('annualShort') : t('monthlyShort');
  
  // Display values (multiply by period)
  const displayNetRent = netMonthlyRent * displayMultiplier;
  const displayMortgageTotal = monthlyMortgageTotal * displayMultiplier;
  const displayCashflow = monthlyCashflow * displayMultiplier;
  const displayAirbnbNet = (monthlyAirbnbNet || 0) * displayMultiplier;
  const displayAirbnbCashflow = airbnbCashflow * displayMultiplier;
  const displayYear5NetRent = year5NetLongTerm * displayMultiplier;
  const displayGrossRent = (monthlyLongTermRent || 0) * displayMultiplier;
  const displayServiceCharges = (monthlyServiceCharges || 0) * displayMultiplier;
  const displayMortgagePayment = monthlyPayment * displayMultiplier;
  const displayInsurance = (totalAnnualInsurance / 12) * displayMultiplier;

  // Grand total calculation: gap + total loan payments + fees + insurance
  const grandTotal = gapAmount + totalLoanPayments + totalUpfrontFees + totalInsuranceOverTerm;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6">
      {/* Header with Mo/Yr Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-theme-accent/20">
            <Building2 className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">{t('financingAnalysisLabel')}</h3>
            <p className="text-xs text-theme-text-muted">{mortgageInputs.financingPercent}% {t('financing')} · {mortgageInputs.loanTermYears} {t('years')} · {mortgageInputs.interestRate}%</p>
          </div>
        </div>
        
        {/* Mo/Yr Toggle in Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-theme-text-muted hidden sm:inline">{t('viewColonLabel')}</span>
          <div className="flex items-center gap-0.5 bg-theme-card-alt rounded-lg p-0.5 border border-theme-border">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === 'monthly' 
                  ? "bg-theme-accent text-theme-bg" 
                  : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              Mo
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === 'annual' 
                  ? "bg-theme-accent text-theme-bg" 
                  : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              Yr
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Enhanced Gap Alert with Timeline */}
        {/* Simplified Gap Alert - Visual Approach */}
        {hasGap && (
          <div className="p-3 bg-theme-accent/10 border border-theme-accent/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-theme-accent" />
                <span className="text-sm font-semibold text-theme-accent">{t('cashShortfallLabel')}</span>
              </div>
              <span className="text-lg font-bold text-theme-accent font-mono">
                {formatCurrency(gapAmount, currency, rate)}
              </span>
            </div>
            <p className="text-xs text-theme-text-muted mb-3">
              {`${t('cashShortfallExplanationPrefix')} ${equityRequiredPercent}${t('cashShortfallExplanationMiddle')} ${preHandoverPercent}${t('cashShortfallExplanationSuffix')}`}
            </p>
            
            {/* Visual Gap Timeline */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-theme-bg overflow-hidden flex">
                <div 
                  className="h-full bg-theme-positive"
                  style={{ width: `${(preHandoverPercent / equityRequiredPercent) * 100}%` }}
                />
                <div 
                  className="h-full bg-theme-accent"
                  style={{ width: `${(gapPercent / equityRequiredPercent) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-theme-accent font-mono whitespace-nowrap">
                {`${t('gapPercentLabel')} ${gapPercent.toFixed(1)}%`}
              </span>
            </div>
          </div>
        )}

        {/* Loan Summary - Updated: added gap, removed equity/total interest */}
        <div className="p-3 bg-theme-bg-alt rounded-xl border border-theme-border">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-theme-accent" />
            <span className="text-sm font-medium text-theme-text-muted">{t('loanSummary')}</span>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Gap Payment - only if exists */}
            {hasGap && (
              <div className="max-w-xs">
                <p className="text-xs text-theme-text-muted">{t('gapPayment')}</p>
                <p className="text-sm font-mono text-theme-accent">{formatCurrency(gapAmount, currency, rate)}</p>
              </div>
            )}
            <div className="max-w-xs">
              <p className="text-xs text-theme-text-muted">{t('loanAmount')}</p>
              <p className="text-sm font-mono text-theme-text">{formatCurrency(loanAmount, currency, rate)}</p>
            </div>
            <div className="max-w-xs">
              <p className="text-xs text-theme-text-muted">{t('monthlyPayment')}</p>
              <p className="text-sm font-mono text-theme-accent">{formatCurrency(monthlyPayment, currency, rate)}</p>
            </div>
            <div className="max-w-xs">
              <p className="text-xs text-theme-text-muted">{t('totalMonthlyWithInsuranceLabel')}</p>
              <p className="text-sm font-mono text-theme-accent">{formatCurrency(monthlyMortgageTotal, currency, rate)}</p>
            </div>
            <div className="max-w-xs">
              <p className="text-xs text-theme-text-muted">{t('loanTerm')}</p>
              <p className="text-sm font-mono text-theme-text">{mortgageInputs.loanTermYears} {t('years')}</p>
            </div>
          </div>
        </div>

        {/* Collapsible Upfront Fees - Progressive Disclosure */}
        <Collapsible open={feesOpen} onOpenChange={setFeesOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-alt border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-theme-text-highlight" />
                <span className="text-sm text-theme-text">{t('bankGovFeesLabel')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-mono text-theme-text">
                  {formatCurrency(totalUpfrontFees + gapAmount, currency, rate)}
                </span>
                {feesOpen ? (
                  <ChevronUp className="w-4 h-4 text-theme-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-theme-text-muted" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 rounded-xl bg-theme-bg-alt border border-theme-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fees */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-3 h-3 text-theme-text-highlight" />
                    <span className="text-xs font-medium text-theme-text-muted">{t('upfrontFees')}</span>
                  </div>
                  {hasGap && (
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('gapPayment')}</span>
                      <span className="text-theme-accent font-mono">{formatCurrency(gapAmount, currency, rate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('processingFee')} ({mortgageInputs.processingFeePercent}%)</span>
                    <span className="text-theme-text font-mono">{formatCurrency(processingFee, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('valuationFee')}</span>
                    <span className="text-theme-text font-mono">{formatCurrency(valuationFee, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('mortgageRegistration')} ({mortgageInputs.mortgageRegistrationPercent}%)</span>
                    <span className="text-theme-text font-mono">{formatCurrency(mortgageRegistration, currency, rate)}</span>
                  </div>
                </div>

                {/* Insurance */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3 h-3 text-theme-positive" />
                    <span className="text-xs font-medium text-theme-text-muted">{t('insurance')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('lifeInsurance')} ({mortgageInputs.lifeInsurancePercent}%)</span>
                    <span className="text-theme-text font-mono">{formatCurrency(annualLifeInsurance, currency, rate)}/{t('yr')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('propertyInsurance')}</span>
                    <span className="text-theme-text font-mono">{formatCurrency(annualPropertyInsurance, currency, rate)}/{t('yr')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">{t('totalAnnual')}</span>
                    <span className="text-theme-text font-mono">{formatCurrency(totalAnnualInsurance, currency, rate)}/{t('yr')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ===== ACT 2: SUSTAINABILITY - RENT VS MORTGAGE ===== */}
        {monthlyLongTermRent !== undefined && monthlyLongTermRent > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-theme-positive/20 to-theme-card border border-theme-positive/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-theme-positive" />
              <span className="text-sm font-medium text-theme-text">{t('rentVsMortgage')}</span>
            </div>

            {/* Coverage Cards - Clickable */}
            <div className={`grid gap-3 ${showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Long-Term Rental Card - Clickable with Hero Number */}
              <div 
                onClick={() => setShowLongTermBreakdown(true)}
                className="p-4 rounded-xl bg-theme-card border border-theme-positive/30 hover:border-theme-positive/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-theme-positive" />
                    <span className="text-sm font-medium text-theme-positive">{t('longTerm')}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    isCovered 
                      ? "bg-theme-positive/20 text-theme-positive" 
                      : "bg-theme-negative/20 text-theme-negative"
                  )}>
                    {isCovered ? t('positiveLabel') : t('negativeLabel')}
                  </span>
                </div>

                {/* HERO NUMBER - Cashflow (Largest on screen) */}
                <div className="text-center py-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-3xl font-bold font-mono",
                      isCovered ? "text-theme-positive" : "text-theme-negative"
                    )}>
                      {displayCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(displayCashflow), currency, rate)}
                    </span>
                    {longTermCoveragePercent > 100 && (
                      <span className="text-sm font-semibold text-theme-positive bg-theme-positive/20 px-2 py-1 rounded-full">
                        {`+${longTermCoveragePercent - 100}% ${t('surplusLabel')}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-theme-text-muted mt-2">
                    {t('rent')} {formatCurrency(displayNetRent, currency, rate)} − {t('mortgage')} {formatCurrency(displayMortgageTotal, currency, rate)}
                  </p>
                </div>

                {/* Coverage Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-theme-text-muted mb-1">
                    <span>{t('covers')}</span>
                    <span className="font-mono">{longTermCoveragePercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-theme-bg overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        longTermCoveragePercent >= 100 
                          ? "bg-gradient-to-r from-theme-positive to-theme-positive" 
                          : longTermCoveragePercent >= 80 
                            ? "bg-gradient-to-r from-theme-accent to-theme-accent"
                            : "bg-gradient-to-r from-theme-negative to-theme-negative"
                      )}
                      style={{ width: `${Math.min(longTermCoveragePercent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-theme-text-muted text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('clickForBreakdownLabel')}
                </p>
              </div>

              {/* Short-Term Rental Card - Clickable with Hero Number */}
              {showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 && (
                <div 
                  onClick={() => setShowAirbnbBreakdown(true)}
                  className="p-4 rounded-xl bg-theme-card border border-theme-accent/30 hover:border-theme-accent/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-theme-accent" />
                      <span className="text-sm font-medium text-theme-accent">{t('shortTerm')}</span>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      isAirbnbCovered 
                        ? "bg-theme-positive/20 text-theme-positive" 
                        : "bg-theme-negative/20 text-theme-negative"
                    )}>
                      {isAirbnbCovered ? t('positiveLabel') : t('negativeLabel')}
                    </span>
                  </div>

                  {/* HERO NUMBER - Cashflow */}
                  <div className="text-center py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-3xl font-bold font-mono",
                        isAirbnbCovered ? "text-theme-accent" : "text-theme-negative"
                      )}>
                        {displayAirbnbCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(displayAirbnbCashflow), currency, rate)}
                      </span>
                      {airbnbCoveragePercent > 100 && (
                        <span className="text-sm font-semibold text-theme-accent bg-theme-accent/20 px-2 py-1 rounded-full">
                          {`+${airbnbCoveragePercent - 100}% ${t('surplusLabel')}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-text-muted mt-2">
                      Net {formatCurrency(displayAirbnbNet, currency, rate)} − {t('mortgage')} {formatCurrency(displayMortgageTotal, currency, rate)}
                    </p>
                  </div>

                  {/* Coverage Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-theme-text-muted mb-1">
                      <span>{t('covers')}</span>
                      <span className="font-mono">{airbnbCoveragePercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-theme-bg overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          airbnbCoveragePercent >= 100 
                            ? "bg-gradient-to-r from-theme-accent to-theme-accent" 
                            : airbnbCoveragePercent >= 80 
                              ? "bg-gradient-to-r from-theme-accent to-theme-accent"
                              : "bg-gradient-to-r from-theme-negative to-theme-negative"
                        )}
                        style={{ width: `${Math.min(airbnbCoveragePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-theme-text-muted text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('clickForBreakdownLabel')}
                  </p>
                </div>
              )}
            </div>

            {/* Year 1 vs Year 5 Growth Comparison - Enhanced Visual */}
            {year5LongTermRent !== undefined && year5LongTermRent > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-theme-text-highlight/20 to-theme-bg/20 rounded-xl border border-theme-text-highlight/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-theme-text-highlight" />
                  <span className="text-xs font-medium text-theme-text-muted">{t('rentGrowthImpact')}</span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  {/* Year 1 */}
                  <div className="flex-1 text-center p-3 bg-theme-bg-alt rounded-lg border border-theme-border">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year1')}</div>
                    <div className="text-lg font-mono font-bold text-theme-text-highlight">{formatCurrency(displayNetRent, currency, rate)}</div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      longTermCoveragePercent >= 100 ? 'text-theme-positive' : 'text-theme-accent'
                    )}>
                      {longTermCoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                  
                  {/* Visual Connection - Dashed Line with Growth Rate */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="relative flex items-center">
                      <div className="w-8 sm:w-12 border-t-2 border-dashed border-theme-text-highlight/50" />
                      <ArrowRight className="w-4 h-4 text-theme-text-highlight -ml-1" />
                    </div>
                    <span className="text-[10px] text-theme-text-highlight font-medium mt-1 whitespace-nowrap">
                      {rentGrowthRate}%/yr
                    </span>
                  </div>
                  
                  {/* Year 5 */}
                  <div className="flex-1 text-center p-3 bg-theme-bg-alt rounded-lg border border-theme-text-highlight/30">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year5')}</div>
                    <div className="text-lg font-mono font-bold text-theme-positive">{formatCurrency(displayYear5NetRent, currency, rate)}</div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      year5CoveragePercent >= 100 ? 'text-theme-positive' : 'text-theme-accent'
                    )}>
                      {year5CoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== NEW: THREE-PILLAR FINANCING ANALYSIS ===== */}
        {monthlyLongTermRent !== undefined && monthlyLongTermRent > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <SafetyBufferPanel
                netMonthlyRent={netMonthlyRent}
                monthlyMortgageTotal={monthlyMortgageTotal}
                currency={currency}
                rate={rate}
                viewMode={viewMode}
              />
              <TenantEquityPanel
                loanAmount={loanAmount}
                amortizationSchedule={amortizationSchedule}
                principalPaidYear5={principalPaidYear5}
                principalPaidYear10={principalPaidYear10}
                loanTermYears={mortgageInputs.loanTermYears}
                currency={currency}
                rate={rate}
              />
              <StressTestPanel
                stressScenarios={stressScenarios}
                currency={currency}
                rate={rate}
                viewMode={viewMode}
              />
            </div>
            
            {/* Amortization Schedule Table - Collapsible */}
            <AmortizationTable
              amortizationSchedule={amortizationSchedule}
              loanAmount={loanAmount}
              loanTermYears={mortgageInputs.loanTermYears}
              currency={currency}
              rate={rate}
            />
          </>
        )}

        {/* Long-Term Coverage Breakdown Dialog */}
        <Dialog open={showLongTermBreakdown} onOpenChange={setShowLongTermBreakdown}>
          <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-theme-positive" />
                {t('coverageBreakdown')} - {t('longTerm')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {/* Rent breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('grossMonthlyRent')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(displayGrossRent, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">− {t('serviceCharges')}</span>
                  <span className="text-theme-negative font-mono">−{formatCurrency(displayServiceCharges, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-theme-positive font-medium">{t('netRent')}</span>
                  <span className="text-theme-positive font-mono font-medium">{formatCurrency(displayNetRent, currency, rate)}</span>
                </div>
              </div>
              {/* Mortgage breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('mortgagePayment')}</span>
                  <span className="text-theme-text-highlight font-mono">{formatCurrency(displayMortgagePayment, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">+ {t('insurance')}</span>
                  <span className="text-theme-text-highlight font-mono">{formatCurrency(displayInsurance, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-theme-text-highlight font-medium">{t('totalMortgage')}</span>
                  <span className="text-theme-text-highlight font-mono font-medium">{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                </div>
              </div>
              {/* Final calculation */}
              <div className="p-3 bg-gradient-to-r from-theme-positive/30 to-theme-bg/30 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-theme-text">{t('finalCashflow')}</span>
                  <span className={`font-mono ${displayCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                    {displayCashflow >= 0 ? '+' : ''}{formatCurrency(displayCashflow, currency, rate)}
                  </span>
                </div>
                <div className="text-center mt-3">
                  <span className={`text-2xl font-bold ${longTermCoveragePercent >= 100 ? 'text-theme-positive' : 'text-theme-accent'}`}>
                    {longTermCoveragePercent}%
                  </span>
                  <p className="text-xs text-theme-text-muted">{t('mortgageCovered')}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Short-Term Coverage Breakdown Dialog */}
        <Dialog open={showAirbnbBreakdown} onOpenChange={setShowAirbnbBreakdown}>
          <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-theme-accent" />
                {t('coverageBreakdown')} - {t('shortTerm')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {/* Rent breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('netMonthlyRent')}</span>
                  <span className="text-theme-accent font-mono">{formatCurrency(displayAirbnbNet, currency, rate)}</span>
                </div>
                <p className="text-[10px] text-theme-text-muted mt-1">{t('airbnbNetRentTooltip')}</p>
              </div>
              {/* Mortgage breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('mortgagePayment')}</span>
                  <span className="text-theme-text-highlight font-mono">{formatCurrency(displayMortgagePayment, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">+ {t('insurance')}</span>
                  <span className="text-theme-text-highlight font-mono">{formatCurrency(displayInsurance, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-theme-text-highlight font-medium">{t('totalMortgage')}</span>
                  <span className="text-theme-text-highlight font-mono font-medium">{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                </div>
              </div>
              {/* Final calculation */}
              <div className="p-3 bg-gradient-to-r from-theme-accent/30 to-theme-bg/30 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-theme-text">{t('finalCashflow')}</span>
                  <span className={`font-mono ${displayAirbnbCashflow >= 0 ? 'text-theme-accent' : 'text-theme-negative'}`}>
                    {displayAirbnbCashflow >= 0 ? '+' : ''}{formatCurrency(displayAirbnbCashflow, currency, rate)}
                  </span>
                </div>
                <div className="text-center mt-3">
                  <span className={`text-2xl font-bold ${airbnbCoveragePercent >= 100 ? 'text-theme-accent' : 'text-theme-accent'}`}>
                    {airbnbCoveragePercent}%
                  </span>
                  <p className="text-xs text-theme-text-muted">{t('mortgageCovered')}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

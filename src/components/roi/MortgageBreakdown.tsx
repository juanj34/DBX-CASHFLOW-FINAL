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

  // Estimated appreciation for wealth position (5% CAGR estimate)
  const appreciationCAGR = 0.05;
  const projectedValue = basePrice * Math.pow(1 + appreciationCAGR, mortgageInputs.loanTermYears);
  const projectedAppreciation = projectedValue - basePrice;
  const netWealthPosition = projectedAppreciation - totalInterestAndFees;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6">
      {/* Header with Mo/Yr Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-theme-accent/20">
            <Building2 className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">{t('mortgageBreakdown')}</h3>
            <p className="text-xs text-theme-text-muted">{mortgageInputs.financingPercent}% {t('financing')} · {mortgageInputs.loanTermYears} {t('years')} · {mortgageInputs.interestRate}%</p>
          </div>
        </div>
        
        {/* Mo/Yr Toggle in Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-theme-text-muted hidden sm:inline">View:</span>
          <div className="flex items-center gap-0.5 bg-theme-card-alt rounded-lg p-0.5 border border-theme-border">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === 'monthly' 
                  ? "bg-theme-accent text-white" 
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
                  ? "bg-theme-accent text-white" 
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
          <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Cash Shortfall</span>
              </div>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {formatCurrency(gapAmount, currency, rate)}
              </span>
            </div>
            <p className="text-xs text-theme-text-muted mb-3">
              Payable at handover — Bank requires {equityRequiredPercent}% equity, you pay {preHandoverPercent}% pre-handover
            </p>
            
            {/* Visual Gap Timeline */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-theme-bg overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500"
                  style={{ width: `${(preHandoverPercent / equityRequiredPercent) * 100}%` }}
                />
                <div 
                  className="h-full bg-amber-500"
                  style={{ width: `${(gapPercent / equityRequiredPercent) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-400 font-mono whitespace-nowrap">
                Gap: {gapPercent.toFixed(1)}%
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
          <div className="grid grid-cols-2 gap-3">
            {/* Gap Payment - only if exists */}
            {hasGap && (
              <div>
                <p className="text-xs text-theme-text-muted">{t('gapPayment')}</p>
                <p className="text-sm font-mono text-yellow-300">{formatCurrency(gapAmount, currency, rate)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-theme-text-muted">{t('loanAmount')}</p>
              <p className="text-sm font-mono text-theme-text">{formatCurrency(loanAmount, currency, rate)}</p>
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">{t('monthlyPayment')}</p>
              <p className="text-sm font-mono text-theme-accent">{formatCurrency(monthlyPayment, currency, rate)}</p>
            </div>
            <div>
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
                <Calculator className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-theme-text">Bank & Gov Fees</span>
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
                    <Calculator className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-medium text-theme-text-muted">{t('upfrontFees')}</span>
                  </div>
                  {hasGap && (
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('gapPayment')}</span>
                      <span className="text-yellow-300 font-mono">{formatCurrency(gapAmount, currency, rate)}</span>
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
                    <Shield className="w-3 h-3 text-emerald-400" />
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-theme-card border border-emerald-700/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-theme-text">{t('rentVsMortgage')}</span>
            </div>

            {/* Coverage Cards - Clickable */}
            <div className={`grid gap-3 ${showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Long-Term Rental Card - Clickable with Hero Number */}
              <div 
                onClick={() => setShowLongTermBreakdown(true)}
                className="p-4 rounded-xl bg-theme-card border border-emerald-700/30 hover:border-emerald-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">{t('longTerm')}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    isCovered 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/20 text-red-400"
                  )}>
                    {isCovered ? 'Positive' : 'Negative'}
                  </span>
                </div>

                {/* HERO NUMBER - Cashflow (Largest on screen) */}
                <div className="text-center py-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-3xl font-bold font-mono",
                      isCovered ? "text-emerald-400" : "text-red-400"
                    )}>
                      {displayCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(displayCashflow), currency, rate)}
                    </span>
                    {longTermCoveragePercent > 100 && (
                      <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                        +{longTermCoveragePercent - 100}% surplus
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
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                          : longTermCoveragePercent >= 80 
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                            : "bg-gradient-to-r from-red-500 to-red-400"
                      )}
                      style={{ width: `${Math.min(longTermCoveragePercent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-theme-text-muted text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click for breakdown
                </p>
              </div>

              {/* Short-Term Rental Card - Clickable with Hero Number */}
              {showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 && (
                <div 
                  onClick={() => setShowAirbnbBreakdown(true)}
                  className="p-4 rounded-xl bg-theme-card border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">{t('shortTerm')}</span>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      isAirbnbCovered 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/20 text-red-400"
                    )}>
                      {isAirbnbCovered ? 'Positive' : 'Negative'}
                    </span>
                  </div>

                  {/* HERO NUMBER - Cashflow */}
                  <div className="text-center py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-3xl font-bold font-mono",
                        isAirbnbCovered ? "text-orange-400" : "text-red-400"
                      )}>
                        {displayAirbnbCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(displayAirbnbCashflow), currency, rate)}
                      </span>
                      {airbnbCoveragePercent > 100 && (
                        <span className="text-sm font-semibold text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
                          +{airbnbCoveragePercent - 100}% surplus
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
                            ? "bg-gradient-to-r from-orange-500 to-orange-400" 
                            : airbnbCoveragePercent >= 80 
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                              : "bg-gradient-to-r from-red-500 to-red-400"
                        )}
                        style={{ width: `${Math.min(airbnbCoveragePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-theme-text-muted text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for breakdown
                  </p>
                </div>
              )}
            </div>

            {/* Year 1 vs Year 5 Growth Comparison - Enhanced Visual */}
            {year5LongTermRent !== undefined && year5LongTermRent > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-theme-text-muted">{t('rentGrowthImpact')}</span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  {/* Year 1 */}
                  <div className="flex-1 text-center p-3 bg-theme-bg-alt rounded-lg border border-theme-border">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year1')}</div>
                    <div className="text-lg font-mono font-bold text-blue-400">{formatCurrency(displayNetRent, currency, rate)}</div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      longTermCoveragePercent >= 100 ? 'text-emerald-400' : 'text-yellow-400'
                    )}>
                      {longTermCoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                  
                  {/* Visual Connection - Dashed Line with Growth Rate */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="relative flex items-center">
                      <div className="w-8 sm:w-12 border-t-2 border-dashed border-blue-400/50" />
                      <ArrowRight className="w-4 h-4 text-blue-400 -ml-1" />
                    </div>
                    <span className="text-[10px] text-blue-400 font-medium mt-1 whitespace-nowrap">
                      {rentGrowthRate}%/yr
                    </span>
                  </div>
                  
                  {/* Year 5 */}
                  <div className="flex-1 text-center p-3 bg-theme-bg-alt rounded-lg border border-blue-500/30">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year5')}</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{formatCurrency(displayYear5NetRent, currency, rate)}</div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      year5CoveragePercent >= 100 ? 'text-emerald-400' : 'text-yellow-400'
                    )}>
                      {year5CoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Long-Term Coverage Breakdown Dialog */}
        <Dialog open={showLongTermBreakdown} onOpenChange={setShowLongTermBreakdown}>
          <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
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
                  <span className="text-red-400 font-mono">−{formatCurrency(displayServiceCharges, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-emerald-400 font-medium">{t('netRent')}</span>
                  <span className="text-emerald-400 font-mono font-medium">{formatCurrency(displayNetRent, currency, rate)}</span>
                </div>
              </div>
              {/* Mortgage breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('mortgagePayment')}</span>
                  <span className="text-purple-400 font-mono">{formatCurrency(displayMortgagePayment, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">+ {t('insurance')}</span>
                  <span className="text-purple-400 font-mono">{formatCurrency(displayInsurance, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-purple-400 font-medium">{t('totalMortgage')}</span>
                  <span className="text-purple-400 font-mono font-medium">{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                </div>
              </div>
              {/* Final calculation */}
              <div className="p-3 bg-gradient-to-r from-emerald-900/30 to-purple-900/30 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-theme-text">{t('finalCashflow')}</span>
                  <span className={`font-mono ${displayCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {displayCashflow >= 0 ? '+' : ''}{formatCurrency(displayCashflow, currency, rate)}
                  </span>
                </div>
                <div className="text-center mt-3">
                  <span className={`text-2xl font-bold ${longTermCoveragePercent >= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
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
                <Building className="w-5 h-5 text-orange-400" />
                {t('coverageBreakdown')} - {t('shortTerm')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {/* Rent breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('netMonthlyRent')}</span>
                  <span className="text-orange-400 font-mono">{formatCurrency(displayAirbnbNet, currency, rate)}</span>
                </div>
                <p className="text-[10px] text-theme-text-muted mt-1">{t('airbnbNetRentTooltip')}</p>
              </div>
              {/* Mortgage breakdown */}
              <div className="p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{t('mortgagePayment')}</span>
                  <span className="text-purple-400 font-mono">{formatCurrency(displayMortgagePayment, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">+ {t('insurance')}</span>
                  <span className="text-purple-400 font-mono">{formatCurrency(displayInsurance, currency, rate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-theme-border mt-2">
                  <span className="text-purple-400 font-medium">{t('totalMortgage')}</span>
                  <span className="text-purple-400 font-mono font-medium">{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                </div>
              </div>
              {/* Final calculation */}
              <div className="p-3 bg-gradient-to-r from-orange-900/30 to-purple-900/30 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-theme-text">{t('finalCashflow')}</span>
                  <span className={`font-mono ${displayAirbnbCashflow >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                    {displayAirbnbCashflow >= 0 ? '+' : ''}{formatCurrency(displayAirbnbCashflow, currency, rate)}
                  </span>
                </div>
                <div className="text-center mt-3">
                  <span className={`text-2xl font-bold ${airbnbCoveragePercent >= 100 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {airbnbCoveragePercent}%
                  </span>
                  <p className="text-xs text-theme-text-muted">{t('mortgageCovered')}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== ACT 3: THE WEALTH EQUATION - Redesigned for Client Psychology ===== */}
        <div className="p-4 bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] rounded-2xl border border-[#CCFF00]/30">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-[#CCFF00]/20">
              <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div>
              <span className="text-base font-semibold text-theme-text">The Wealth Equation</span>
              <p className="text-[10px] text-theme-text-muted">Your path to ownership</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Card 1: Cash to Keys - Visual Donut */}
            <div className="p-4 bg-theme-bg-alt rounded-xl border border-theme-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-sm font-medium text-theme-text">Cash to Keys</span>
                </div>
                <span className="text-lg font-bold text-[#CCFF00] font-mono">
                  {formatCurrency(preHandoverAmount + gapAmount + totalUpfrontFees, currency, rate)}
                </span>
              </div>
              
              {/* Visual Stacked Bar Chart */}
              <div className="space-y-3">
                <div className="flex h-6 rounded-lg overflow-hidden bg-theme-bg">
                  {/* Pre-Handover - Largest */}
                  <div 
                    className="bg-emerald-500 flex items-center justify-center transition-all"
                    style={{ width: `${(preHandoverAmount / (preHandoverAmount + gapAmount + totalUpfrontFees)) * 100}%` }}
                  >
                    <span className="text-[9px] text-white font-medium truncate px-1">Paid</span>
                  </div>
                  {/* Gap - Yellow */}
                  {hasGap && (
                    <div 
                      className="bg-amber-500 flex items-center justify-center transition-all"
                      style={{ width: `${(gapAmount / (preHandoverAmount + gapAmount + totalUpfrontFees)) * 100}%` }}
                    >
                      <span className="text-[9px] text-black font-medium truncate px-1">Gap</span>
                    </div>
                  )}
                  {/* Fees - Gray */}
                  <div 
                    className="bg-gray-500 flex items-center justify-center transition-all"
                    style={{ width: `${(totalUpfrontFees / (preHandoverAmount + gapAmount + totalUpfrontFees)) * 100}%` }}
                  >
                    <span className="text-[9px] text-white font-medium truncate px-1">Fees</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-theme-text-muted">Pre-Handover</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(preHandoverAmount, currency, rate)}</span>
                  </div>
                  {hasGap && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span className="text-theme-text-muted">Gap</span>
                      <span className="font-mono text-amber-400">{formatCurrency(gapAmount, currency, rate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-gray-500" />
                    <span className="text-theme-text-muted">Fees</span>
                    <span className="font-mono text-gray-400">{formatCurrency(totalUpfrontFees, currency, rate)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-theme-text-muted mt-3 text-center">
                This is all you need to own a {formatCurrency(basePrice, currency, rate)} asset
              </p>
            </div>
            
            {/* Card 2: Monthly Installment with Rental Coverage Badge */}
            <div className="p-4 bg-theme-bg-alt rounded-xl border border-theme-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-theme-text">Monthly Installment</span>
                </div>
                
                {/* Rental Coverage Badge */}
                {monthlyLongTermRent && monthlyLongTermRent > 0 && (
                  <span className={cn(
                    "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full",
                    longTermCoveragePercent >= 100 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : longTermCoveragePercent >= 80
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}>
                    {longTermCoveragePercent >= 100 ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {longTermCoveragePercent}% Covered by Rent
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        {longTermCoveragePercent}% Rent Coverage
                      </>
                    )}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-8">
                    <span className="text-theme-text-muted">Mortgage Payment</span>
                    <span className="font-mono text-theme-text">{formatCurrency(monthlyPayment, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-theme-text-muted">+ Insurance</span>
                    <span className="font-mono text-theme-text">{formatCurrency(totalAnnualInsurance / 12, currency, rate)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-400 font-mono">
                    {formatCurrency(monthlyMortgageTotal, currency, rate)}
                  </span>
                  <p className="text-[10px] text-theme-text-muted">/month</p>
                </div>
              </div>
              
              {/* Visual reminder that tenant pays */}
              {monthlyLongTermRent && longTermCoveragePercent >= 80 && (
                <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400 text-center">
                    💡 Your tenant essentially pays this for you
                  </p>
                </div>
              )}
            </div>
            
            {/* Card 3: The Wealth Equation - Visual Comparison Bar */}
            <div className="p-4 bg-gradient-to-r from-theme-bg-alt to-emerald-900/20 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-theme-text">Cost of Debt vs Wealth Created</span>
              </div>
              
              {/* Visual Comparison Bars */}
              <div className="space-y-3 mb-4">
                {/* Cost of Debt - Small, gray/red */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Cost of Debt ({mortgageInputs.loanTermYears}Y)</span>
                    <span className="font-mono text-gray-400">{formatCurrency(totalInterestAndFees, currency, rate)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-theme-bg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full transition-all"
                      style={{ width: `${Math.min((totalInterestAndFees / projectedAppreciation) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Wealth Created - Large, green */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">Projected Appreciation</span>
                    <span className="font-mono text-emerald-400">+{formatCurrency(projectedAppreciation, currency, rate)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-theme-bg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#CCFF00] rounded-full transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* NET WEALTH - Hero Number (3x larger) */}
              <div className="p-4 bg-[#CCFF00]/10 rounded-xl border border-[#CCFF00]/30 text-center">
                <p className="text-xs text-theme-text-muted uppercase tracking-wider mb-2">Net Wealth Created</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={cn(
                    "text-4xl sm:text-5xl font-bold font-mono",
                    netWealthPosition >= 0 ? "text-[#CCFF00]" : "text-red-400"
                  )}>
                    {netWealthPosition >= 0 ? '+' : ''}{formatCurrency(Math.abs(netWealthPosition), currency, rate)}
                  </span>
                  {netWealthPosition >= 0 && (
                    <span className="text-2xl">🚀</span>
                  )}
                </div>
                <p className="text-xs text-theme-text-muted mt-2">
                  Property growth crushes debt cost by {((projectedAppreciation / totalInterestAndFees) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

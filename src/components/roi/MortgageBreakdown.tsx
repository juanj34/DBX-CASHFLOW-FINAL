import { useState } from "react";
import { Building2, AlertTriangle, TrendingUp, Shield, CreditCard, Calculator, Home, CheckCircle, AlertCircle, Building, Info } from "lucide-react";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { CollapsibleSection } from "./CollapsibleSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-theme-accent/20">
          <Building2 className="w-5 h-5 text-theme-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">{t('mortgageBreakdown')}</h3>
          <p className="text-xs text-theme-text-muted">{mortgageInputs.financingPercent}% {t('financing')} · {mortgageInputs.loanTermYears} {t('years')} · {mortgageInputs.interestRate}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Enhanced Gap Alert with Timeline */}
        {hasGap && (
          <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl">
            <div className="flex items-start gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-semibold">{t('gapPaymentRequired')}</h4>
                <p className="text-sm text-theme-text-muted">{t('gapPaymentDesc')}</p>
              </div>
            </div>
            
            {/* Payment Timeline Visual - Enhanced */}
            <div className="space-y-4 mt-4">
              {/* Stage labels */}
              <div className="flex items-center justify-between text-[10px] text-theme-text-muted uppercase tracking-wider px-1">
                <span>{t('beforeHandover') || 'Before Handover'}</span>
                <span>{t('atHandover') || 'At Handover'}</span>
              </div>
              
              {/* Timeline bar */}
              <div className="relative h-3 bg-theme-card-alt rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-l-full"
                  style={{ width: `${preHandoverPercent}%` }}
                />
                <div 
                  className="absolute top-0 h-full bg-yellow-400"
                  style={{ left: `${preHandoverPercent}%`, width: `${gapPercent}%` }}
                />
                <div 
                  className="absolute top-0 h-full bg-blue-500 rounded-r-full"
                  style={{ left: `${equityRequiredPercent}%`, width: `${mortgageInputs.financingPercent}%` }}
                />
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-theme-text-muted">{t('preHandoverPayments')}</p>
                    <p className="text-green-400 font-mono">{formatCurrency(preHandoverAmount, currency, rate)}</p>
                    <p className="text-[10px] text-theme-text-muted">{preHandoverPercent}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div>
                    <p className="text-theme-text-muted">{t('gapPayment')}</p>
                    <p className="text-yellow-300 font-mono font-semibold">{formatCurrency(gapAmount, currency, rate)}</p>
                    <p className="text-[10px] text-theme-text-muted">{gapPercent.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-theme-text-muted">{t('mortgage')}</p>
                    <p className="text-blue-400 font-mono">{formatCurrency(loanAmount, currency, rate)}</p>
                    <p className="text-[10px] text-theme-text-muted">{mortgageInputs.financingPercent}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-amber-700/30 flex justify-between">
              <span className="text-sm text-theme-text-muted">{t('totalBeforeHandover')}</span>
              <span className="text-sm font-mono text-theme-text font-bold">
                {formatCurrency(totalBeforeHandover, currency, rate)} ({equityRequiredPercent}%)
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

        {/* Fees & Insurance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fees */}
          <div className="p-3 bg-theme-bg-alt rounded-xl border border-theme-border">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-theme-text-muted">{t('upfrontFees')}</span>
            </div>
            <div className="space-y-2 text-xs">
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
              <div className="flex justify-between pt-2 border-t border-theme-border">
                <span className="text-theme-text-muted font-medium">{t('total')}</span>
                <span className="text-purple-400 font-mono font-medium">{formatCurrency(totalUpfrontFees + gapAmount, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="p-3 bg-theme-bg-alt rounded-xl border border-theme-border">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-theme-text-muted">{t('insurance')}</span>
            </div>
            <div className="space-y-2 text-xs">
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
              <div className="flex justify-between pt-2 border-t border-theme-border">
                <span className="text-theme-text-muted font-medium">{t('overTerm')} ({mortgageInputs.loanTermYears}y)</span>
                <span className="text-green-400 font-mono font-medium">{formatCurrency(totalInsuranceOverTerm, currency, rate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rent vs Mortgage Coverage - Collapsible Side-by-Side Comparison */}
        {monthlyLongTermRent !== undefined && monthlyLongTermRent > 0 && (
          <CollapsibleSection
            title={t('rentVsMortgage')}
            subtitle={`${periodLabel}: ${formatCurrency(displayMortgageTotal, currency, rate)}`}
            icon={<Home className="w-5 h-5 text-purple-400" />}
            defaultOpen={false}
            headerAction={
              <div 
                className="flex items-center gap-1 bg-theme-card-alt rounded-lg p-0.5 ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                    viewMode === 'monthly' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {t('monthlyShort')}
                </button>
                <button
                  onClick={() => setViewMode('annual')}
                  className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                    viewMode === 'annual' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {t('annualShort')}
                </button>
              </div>
            }
          >
            {/* Two columns comparison */}
            <div className={`grid gap-3 ${showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Long-Term Rental Column */}
              <div className="p-3 bg-theme-bg-alt rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">{t('longTerm')}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-theme-text-muted">{t('netMonthlyRent')}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-theme-text-muted cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-theme-card border-theme-border text-theme-text max-w-xs">
                            <p>{t('longTermNetRentTooltip')}</p>
                            <p className="text-theme-text-muted mt-1">
                              {t('grossMonthlyRent')}: {formatCurrency(monthlyLongTermRent || 0, currency, rate)} − {t('serviceCharges')}: {formatCurrency(monthlyServiceCharges || 0, currency, rate)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-emerald-400 font-mono">{formatCurrency(displayNetRent, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">− {t('mortgage')}</span>
                    <span className="text-purple-400 font-mono">−{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                  </div>
                  {/* Cashflow result */}
                  <div className={`flex justify-between items-center pt-2 mt-2 border-t border-theme-border ${isCovered ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="flex items-center gap-1">
                      {isCovered ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span className="font-medium">{t('cashflow')}</span>
                    </div>
                    <span className="font-mono font-bold">
                      {displayCashflow >= 0 ? '+' : ''}{formatCurrency(displayCashflow, currency, rate)}
                    </span>
                  </div>
                  {/* Coverage percentage indicator with progress bar - Clickable */}
                  <div 
                    className="mt-3 pt-2 border-t border-theme-border cursor-pointer hover:bg-theme-card/50 rounded-lg p-1 -m-1 transition-colors"
                    onClick={() => setShowLongTermBreakdown(true)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-theme-text-muted">{t('covers')}</span>
                      <span className={`text-xs font-bold ${longTermCoveragePercent >= 100 ? 'text-emerald-400' : longTermCoveragePercent >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {longTermCoveragePercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-theme-card-alt rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          longTermCoveragePercent >= 100 ? 'bg-emerald-500' : 
                          longTermCoveragePercent >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(longTermCoveragePercent, 100)}%` }}
                      />
                    </div>
                    {longTermCoveragePercent > 100 && (
                      <div className="text-center mt-1">
                        <span className="text-[10px] text-emerald-400">+{longTermCoveragePercent - 100}% surplus</span>
                      </div>
                    )}
                    <p className="text-[10px] text-theme-text-muted text-center mt-1">{t('clickForDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Airbnb Column (if enabled) */}
              {showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 && (
                <div className="p-3 bg-theme-bg-alt rounded-xl border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Airbnb</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-theme-text-muted">{t('netMonthlyRent')}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-theme-text-muted cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-theme-card border-theme-border text-theme-text max-w-xs">
                              <p>{t('airbnbNetRentTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-orange-400 font-mono">{formatCurrency(displayAirbnbNet, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">− {t('mortgage')}</span>
                      <span className="text-purple-400 font-mono">−{formatCurrency(displayMortgageTotal, currency, rate)}</span>
                    </div>
                    {/* Cashflow result */}
                    <div className={`flex justify-between items-center pt-2 mt-2 border-t border-theme-border ${isAirbnbCovered ? 'text-orange-400' : 'text-red-400'}`}>
                      <div className="flex items-center gap-1">
                        {isAirbnbCovered ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="font-medium">{t('cashflow')}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {displayAirbnbCashflow >= 0 ? '+' : ''}{formatCurrency(displayAirbnbCashflow, currency, rate)}
                      </span>
                    </div>
                    {/* Coverage percentage indicator with progress bar - Clickable */}
                    <div 
                      className="mt-3 pt-2 border-t border-theme-border cursor-pointer hover:bg-theme-card/50 rounded-lg p-1 -m-1 transition-colors"
                      onClick={() => setShowAirbnbBreakdown(true)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-theme-text-muted">{t('covers')}</span>
                        <span className={`text-xs font-bold ${airbnbCoveragePercent >= 100 ? 'text-orange-400' : airbnbCoveragePercent >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {airbnbCoveragePercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-theme-card-alt rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            airbnbCoveragePercent >= 100 ? 'bg-orange-500' : 
                            airbnbCoveragePercent >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(airbnbCoveragePercent, 100)}%` }}
                        />
                      </div>
                      {airbnbCoveragePercent > 100 && (
                        <div className="text-center mt-1">
                          <span className="text-[10px] text-orange-400">+{airbnbCoveragePercent - 100}% surplus</span>
                        </div>
                      )}
                      <p className="text-[10px] text-theme-text-muted text-center mt-1">{t('clickForDetails')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Year 1 vs Year 5 Growth Comparison */}
            {year5LongTermRent !== undefined && year5LongTermRent > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-theme-text-muted">{t('rentGrowthImpact')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* Year 1 */}
                  <div className="text-center p-2 bg-theme-bg-alt rounded-lg">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year1')}</div>
                    <div className="text-sm font-mono text-emerald-400">{formatCurrency(displayNetRent, currency, rate)}</div>
                    <div className={`text-[10px] mt-1 whitespace-nowrap ${longTermCoveragePercent >= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {longTermCoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] text-blue-400 mt-1">+{rentGrowthPercent}%</span>
                    </div>
                  </div>
                  
                  {/* Year 5 */}
                  <div className="text-center p-2 bg-theme-bg-alt rounded-lg">
                    <div className="text-[10px] text-theme-text-muted mb-1">{t('year5')}</div>
                    <div className="text-sm font-mono text-emerald-400">{formatCurrency(displayYear5NetRent, currency, rate)}</div>
                    <div className={`text-[10px] mt-1 whitespace-nowrap ${year5CoveragePercent >= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {year5CoveragePercent}% {t('coverage')}
                    </div>
                  </div>
                </div>
                
                {/* Growth summary */}
                <div className="mt-2 pt-2 border-t border-blue-500/20 text-center">
                  <span className="text-[10px] text-theme-text-muted">
                    {t('rentIncrease')}: <span className="text-emerald-400 font-medium">+{rentGrowthPercent}%</span> {t('over5Years')}
                  </span>
                </div>
              </div>
            )}
          </CollapsibleSection>
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

        {/* Airbnb Coverage Breakdown Dialog */}
        <Dialog open={showAirbnbBreakdown} onOpenChange={setShowAirbnbBreakdown}>
          <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-400" />
                {t('coverageBreakdown')} - Airbnb
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

        {/* Client-Focused Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span className="text-base font-semibold text-theme-text">{t('yourCashRequirements') || 'Your Cash Requirements'}</span>
          </div>
          
          <div className="space-y-4">
            {/* Before Handover */}
            <div className="p-3 bg-theme-bg-alt rounded-lg">
              <p className="text-xs text-theme-text-muted mb-2 uppercase tracking-wider">{t('beforeHandover') || 'Before Handover'}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-text-muted">{t('preHandoverPayments')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(preHandoverAmount, currency, rate)}</span>
                </div>
                {hasGap && (
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">+ {t('gapPayment')}</span>
                    <span className="text-yellow-300 font-mono">{formatCurrency(gapAmount, currency, rate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-theme-text-muted">+ {t('upfrontFees')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(totalUpfrontFees, currency, rate)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-theme-border">
                  <span className="text-theme-text font-medium">{t('totalCashNeeded') || 'Total Cash Needed'}</span>
                  <span className="text-theme-accent font-mono font-bold">{formatCurrency(preHandoverAmount + gapAmount + totalUpfrontFees, currency, rate)}</span>
                </div>
              </div>
            </div>
            
            {/* Monthly After Handover */}
            <div className="p-3 bg-theme-bg-alt rounded-lg">
              <p className="text-xs text-theme-text-muted mb-2 uppercase tracking-wider">{t('monthlyAfterHandover') || 'Monthly After Handover'}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-text-muted">{t('mortgagePayment')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(monthlyPayment, currency, rate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-text-muted">+ {t('insurance')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(totalAnnualInsurance / 12, currency, rate)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-theme-border">
                  <span className="text-theme-text font-medium">{t('monthlyCommitment') || 'Monthly Commitment'}</span>
                  <span className="text-blue-400 font-mono font-bold">{formatCurrency(monthlyMortgageTotal, currency, rate)}</span>
                </div>
              </div>
            </div>
            
            {/* Total Interest */}
            <div className="p-3 bg-theme-bg-alt rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-theme-text-muted text-sm">{t('totalInterestPaid') || 'Total Interest Paid'}</span>
                  <p className="text-[10px] text-theme-text-muted">({mortgageInputs.loanTermYears} {t('years')})</p>
                </div>
                <span className="text-red-400 font-mono font-bold">{formatCurrency(totalInterestAndFees, currency, rate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

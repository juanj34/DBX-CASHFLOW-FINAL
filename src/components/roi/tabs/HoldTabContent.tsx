import { useState } from "react";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { InvestmentJourneyCards } from "@/components/roi/InvestmentJourneyCards";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ChevronDown, ChevronUp, Table, AlertTriangle } from "lucide-react";
import { ProjectionDisclaimer } from "@/components/roi/ProjectionDisclaimer";
import { useLanguage } from "@/contexts/LanguageContext";

interface HoldTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  totalCapitalInvested: number;
  unitSizeSqf?: number;
  variant?: 'default' | 'dashboard';
}

export const HoldTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  totalCapitalInvested,
  unitSizeSqf,
  variant = 'default',
}: HoldTabContentProps) => {
  const { t } = useLanguage();
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const isDashboard = variant === 'dashboard';
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [show10YearProjections, setShow10YearProjections] = useState(false);

  return (
    <div className="space-y-6">
      {/* Row 1: RentSnapshot (full width) */}
      <RentSnapshot 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
        holdAnalysis={calculations.holdAnalysis} 
      />
      
      {/* Row 2: Investment Journey Cards - Hero Strategy Winner + 3 Milestones */}
      <InvestmentJourneyCards
        projections={calculations.yearlyProjections}
        currency={currency}
        rate={rate}
        showAirbnbComparison={calculations.showAirbnbComparison}
        totalCapitalInvested={totalCapitalInvested}
        basePrice={inputs.basePrice}
      />
      
      {/* Row 3: Collapsible 10-Year Projections (Hidden by default) */}
      <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShow10YearProjections(!show10YearProjections)}
          className="w-full p-4 flex items-center justify-between hover:bg-theme-card-alt/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">{t('advancedProjections')}</span>
            <span className="text-xs text-amber-400/70">({t('advancedProjectionsDesc')})</span>
          </div>
          {show10YearProjections ? (
            <ChevronUp className="w-4 h-4 text-theme-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-theme-text-muted" />
          )}
        </button>
        
        {show10YearProjections && (
          <div className="border-t border-theme-border animate-in slide-in-from-top-2 duration-300 p-4 space-y-4">
            {/* Disclaimer */}
            <ProjectionDisclaimer variant="full" />
            
            {/* 10-Year Components */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CumulativeIncomeChart 
                  projections={calculations.yearlyProjections} 
                  currency={currency} 
                  rate={rate} 
                  totalCapitalInvested={totalCapitalInvested} 
                  showAirbnbComparison={calculations.showAirbnbComparison} 
                />
              </div>
              
              <WealthSummaryCard 
                propertyValueYear10={lastProjection.propertyValue} 
                cumulativeRentIncome={lastProjection.cumulativeNetIncome} 
                airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} 
                initialInvestment={totalCapitalInvested} 
                currency={currency} 
                rate={rate} 
                showAirbnbComparison={calculations.showAirbnbComparison} 
              />
            </div>
            
            {/* Detailed Table */}
            <OIYearlyProjectionTable 
              projections={calculations.yearlyProjections} 
              currency={currency} 
              rate={rate} 
              showAirbnbComparison={calculations.showAirbnbComparison} 
              unitSizeSqf={unitSizeSqf}
              embedded={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
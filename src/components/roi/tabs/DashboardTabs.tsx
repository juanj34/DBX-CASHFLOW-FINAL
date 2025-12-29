import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Home, TrendingUp, Building2, FileText } from "lucide-react";
import { PropertyTabContent } from "./PropertyTabContent";
import { HoldTabContent } from "./HoldTabContent";
import { ExitTabContent } from "./ExitTabContent";
import { MortgageTabContent } from "./MortgageTabContent";
import { SummaryTabContent } from "./SummaryTabContent";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { useLanguage } from "@/contexts/LanguageContext";

export type TabId = 'property' | 'hold' | 'exit' | 'mortgage' | 'summary';

interface DashboardTabsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  setExitScenarios: (scenarios: number[]) => void;
  currency: Currency;
  rate: number;
  onEditConfig: () => void;
  customDifferentiators?: any[];
  defaultTab?: TabId;
}

export const DashboardTabs = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  setExitScenarios,
  currency,
  rate,
  onEditConfig,
  customDifferentiators = [],
  defaultTab = 'property',
}: DashboardTabsProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;
  
  // Determine which tabs to show based on enabled sections
  const showHoldTab = inputs.enabledSections?.longTermHold !== false;
  const showExitTab = inputs.enabledSections?.exitStrategy !== false;
  const showMortgageTab = mortgageInputs.enabled;

  const tabs = [
    { id: 'property' as TabId, label: t('tabProperty'), icon: CreditCard, show: true },
    { id: 'hold' as TabId, label: t('tabHold'), icon: Home, show: showHoldTab },
    { id: 'exit' as TabId, label: t('tabExit'), icon: TrendingUp, show: showExitTab },
    { id: 'mortgage' as TabId, label: t('tabMortgage'), icon: Building2, show: showMortgageTab },
    { id: 'summary' as TabId, label: t('tabSummary'), icon: FileText, show: true },
  ].filter(tab => tab.show);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
      <TabsList className="w-full justify-start bg-theme-card/50 border border-theme-border rounded-xl p-1 mb-6 overflow-x-auto flex-nowrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-theme-accent/20 data-[state=active]:text-theme-accent data-[state=active]:border-b-2 data-[state=active]:border-theme-accent text-theme-text-muted hover:text-theme-text transition-all whitespace-nowrap"
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="property" className="mt-0">
        <PropertyTabContent
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          clientInfo={clientInfo}
          customDifferentiators={customDifferentiators}
          onEditConfig={onEditConfig}
          onEditClient={onEditConfig}
        />
      </TabsContent>

      {showHoldTab && (
        <TabsContent value="hold" className="mt-0">
          <HoldTabContent
            inputs={inputs}
            calculations={calculations}
            currency={currency}
            rate={rate}
            totalCapitalInvested={totalCapitalInvested}
            unitSizeSqf={clientInfo.unitSizeSqf}
          />
        </TabsContent>
      )}

      {showExitTab && (
        <TabsContent value="exit" className="mt-0">
          <ExitTabContent
            inputs={inputs}
            calculations={calculations}
            currency={currency}
            rate={rate}
            exitScenarios={exitScenarios}
            setExitScenarios={setExitScenarios}
            unitSizeSqf={clientInfo.unitSizeSqf}
          />
        </TabsContent>
      )}

      {showMortgageTab && (
        <TabsContent value="mortgage" className="mt-0">
          <MortgageTabContent
            inputs={inputs}
            calculations={calculations}
            mortgageInputs={mortgageInputs}
            mortgageAnalysis={mortgageAnalysis}
            currency={currency}
            rate={rate}
          />
        </TabsContent>
      )}

      <TabsContent value="summary" className="mt-0">
        <SummaryTabContent
          inputs={inputs}
          clientInfo={clientInfo}
          calculations={calculations}
          mortgageInputs={mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          exitScenarios={exitScenarios}
          currency={currency}
          rate={rate}
        />
      </TabsContent>
    </Tabs>
  );
};

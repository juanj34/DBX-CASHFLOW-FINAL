import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Building2, Clock, Home, LineChart, Sliders } from "lucide-react";
import { CapitalTimelineTab } from "./CapitalTimelineTab";
import { ROIReturnsTab } from "./ROIReturnsTab";
import { ExitsROETab } from "./ExitsROETab";
import { MortgageCoverageTab } from "./MortgageCoverageTab";
import { PostHandoverCoverageTab } from "./PostHandoverCoverageTab";
import { RentalsTab } from "./RentalsTab";
import { ScenarioAnalysisTab } from "./ScenarioAnalysisTab";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";

export type AnalysisTabId = 'timeline' | 'roi' | 'exits' | 'mortgage' | 'posthandover' | 'rentals' | 'scenarios';

interface AnalysisTabsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  setExitScenarios?: (scenarios: number[]) => void;
  currency: Currency;
  rate: number;
  onEditConfig?: () => void;
  readOnly?: boolean;
}

export const AnalysisTabs = ({
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
  readOnly = false,
}: AnalysisTabsProps) => {
  const [activeTab, setActiveTab] = useState<AnalysisTabId>('timeline');

  const showMortgageTab = mortgageInputs.enabled;
  const showPostHandoverTab = inputs.hasPostHandoverPlan;

  const tabs = [
    { id: 'timeline' as AnalysisTabId, label: 'Capital', icon: LineChart, show: true },
    { id: 'roi' as AnalysisTabId, label: 'ROI', icon: TrendingUp, show: true },
    { id: 'exits' as AnalysisTabId, label: 'Exits', icon: BarChart3, show: true },
    { id: 'mortgage' as AnalysisTabId, label: 'Mortgage', icon: Building2, show: showMortgageTab },
    { id: 'posthandover' as AnalysisTabId, label: 'Post-HO', icon: Clock, show: showPostHandoverTab },
    { id: 'rentals' as AnalysisTabId, label: 'Rentals', icon: Home, show: true },
    { id: 'scenarios' as AnalysisTabId, label: 'Scenarios', icon: Sliders, show: true },
  ].filter(tab => tab.show);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisTabId)} className="w-full">
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

      <TabsContent value="timeline" className="mt-0">
        <CapitalTimelineTab
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </TabsContent>

      <TabsContent value="roi" className="mt-0">
        <ROIReturnsTab
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          unitSizeSqf={clientInfo.unitSizeSqf}
        />
      </TabsContent>

      <TabsContent value="exits" className="mt-0">
        <ExitsROETab
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          exitScenarios={exitScenarios}
          setExitScenarios={setExitScenarios || (() => {})}
          unitSizeSqf={clientInfo.unitSizeSqf}
          readOnly={readOnly}
        />
      </TabsContent>

      {showMortgageTab && (
        <TabsContent value="mortgage" className="mt-0">
          <MortgageCoverageTab
            inputs={inputs}
            calculations={calculations}
            mortgageInputs={mortgageInputs}
            mortgageAnalysis={mortgageAnalysis}
            currency={currency}
            rate={rate}
          />
        </TabsContent>
      )}

      {showPostHandoverTab && (
        <TabsContent value="posthandover" className="mt-0">
          <PostHandoverCoverageTab
            inputs={inputs}
            calculations={calculations}
            currency={currency}
            rate={rate}
          />
        </TabsContent>
      )}

      <TabsContent value="rentals" className="mt-0">
        <RentalsTab
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </TabsContent>

      <TabsContent value="scenarios" className="mt-0">
        <ScenarioAnalysisTab
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </TabsContent>
    </Tabs>
  );
};

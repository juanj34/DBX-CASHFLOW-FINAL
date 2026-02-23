import { useState } from 'react';
import { Settings, LayoutDashboard, CreditCard, TrendingUp, Building2, LineChart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { OverviewTab } from './OverviewTab';
import { CompactPaymentTable } from './CompactPaymentTable';
import { PaymentBreakdownDetailed } from './PaymentBreakdownDetailed';
import { ExitsTab } from './ExitsTab';
import { MortgageTab } from './MortgageTab';
import { WealthTab } from './WealthTab';
import { PostHandoverTab } from './PostHandoverTab';
import { WealthProjectionModal } from './WealthProjectionModal';
import { FloorPlanLightbox } from '@/components/roi/FloorPlanLightbox';
import { useLanguage } from '@/contexts/LanguageContext';

type TabId = 'overview' | 'payments' | 'exits' | 'mortgage' | 'wealth' | 'posthandover';

interface SnapshotContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  setExitScenarios?: (scenarios: number[]) => void;
  quoteImages: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
    buildingRenderUrl?: string | null;
  };
  currency: Currency;
  setCurrency?: (currency: Currency) => void;
  language: 'en' | 'es';
  setLanguage?: (language: 'en' | 'es') => void;
  rate: number;
  // Snapshot title (editable headline)
  snapshotTitle?: string | null;
  onSnapshotTitleChange?: (title: string) => void;
  // Floating edit button handler
  onEditClick?: () => void;
}

export const SnapshotContent = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  setExitScenarios,
  quoteImages,
  currency,
  setCurrency,
  language,
  setLanguage,
  rate,
  snapshotTitle,
  onSnapshotTitleChange,
  onEditClick,
}: SnapshotContentProps) => {
  const { t } = useLanguage();
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [wealthModalOpen, setWealthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [paymentView, setPaymentView] = useState<'simple' | 'detailed'>('simple');
  const basePrice = calculations.basePrice;

  // Calculate price per sqft
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;

  // Conditional tabs
  const showMortgage = mortgageInputs.enabled;
  const showPostHandover = inputs.hasPostHandoverPlan;
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
  const readOnly = !setExitScenarios;

  // Tab trigger styling
  const triggerClass = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap data-[state=active]:bg-theme-accent/20 data-[state=active]:text-theme-accent text-theme-text-muted hover:text-theme-text transition-all";

  return (
    <div className="min-h-full flex flex-col bg-theme-bg max-w-[1600px] mx-auto w-full">
      {/* Hero - fixed height */}
      <div className="flex-shrink-0 p-4 pb-0">
        <PropertyHeroCard
          data={clientInfo}
          heroImageUrl={quoteImages.heroImageUrl}
          buildingRenderUrl={quoteImages.buildingRenderUrl}
          readOnly={!onSnapshotTitleChange}
          showPriceInfo={true}
          basePrice={basePrice}
          pricePerSqft={pricePerSqft}
          currency={currency}
          setCurrency={setCurrency}
          language={language}
          setLanguage={setLanguage}
          rate={rate}
          floorPlanUrl={quoteImages.floorPlanUrl}
          onViewFloorPlan={() => setFloorPlanOpen(true)}
          snapshotTitle={snapshotTitle}
          onSnapshotTitleChange={onSnapshotTitleChange}
        />
      </div>

      {/* Tabs - Main content area */}
      <div className="flex-1 px-4 py-3 pb-4" data-export-layout="expand">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
          <TabsList className="w-full justify-start bg-theme-card/50 border border-theme-border rounded-xl p-1 mb-4 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className={triggerClass}>
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('overviewTabLabel')}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className={triggerClass}>
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t('paymentBreakdownHeader')}</span>
            </TabsTrigger>
            {showExits && (
              <TabsTrigger value="exits" className={triggerClass}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t('exitsTabLabel')}</span>
              </TabsTrigger>
            )}
            {showMortgage && (
              <TabsTrigger value="mortgage" className={triggerClass}>
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('mortgage')}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="wealth" className={triggerClass}>
              <LineChart className="w-3.5 h-3.5" />
              <span>{t('wealthTabLabel')}</span>
            </TabsTrigger>
            {showPostHandover && (
              <TabsTrigger value="posthandover" className={triggerClass}>
                <Clock className="w-3.5 h-3.5" />
                <span>{t('postHoTabLabel')}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              inputs={inputs}
              calculations={calculations}
              clientInfo={clientInfo}
              mortgageInputs={mortgageInputs}
              mortgageAnalysis={mortgageAnalysis}
              exitScenarios={exitScenarios}
              currency={currency}
              rate={rate}
              onViewWealthProjection={() => setWealthModalOpen(true)}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
            />
          </TabsContent>

          {/* Tab 2: Payment Plan with Simple/Detailed toggle */}
          <TabsContent value="payments" className="mt-0">
            <div className="flex justify-end mb-3">
              <div className="inline-flex rounded-lg bg-theme-card/50 border border-theme-border p-0.5">
                <button
                  onClick={() => setPaymentView('simple')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    paymentView === 'simple'
                      ? 'bg-theme-accent/20 text-theme-accent'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {t('switchToOption1')}
                </button>
                <button
                  onClick={() => setPaymentView('detailed')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    paymentView === 'detailed'
                      ? 'bg-theme-accent/20 text-theme-accent'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {t('switchToOption2')}
                </button>
              </div>
            </div>

            {paymentView === 'simple' ? (
              <CompactPaymentTable
                inputs={inputs}
                clientInfo={clientInfo}
                currency={currency}
                rate={rate}
                totalMonths={calculations.totalMonths}
                twoColumnMode="auto"
                collapsiblePhases={false}
              />
            ) : (
              <PaymentBreakdownDetailed
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo}
                currency={currency}
                rate={rate}
              />
            )}
          </TabsContent>

          {/* Tab 3: Exits */}
          {showExits && (
            <TabsContent value="exits" className="mt-0">
              <ExitsTab
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
          )}

          {/* Tab 4: Mortgage (conditional) */}
          {showMortgage && (
            <TabsContent value="mortgage" className="mt-0">
              <MortgageTab
                inputs={inputs}
                calculations={calculations}
                mortgageInputs={mortgageInputs}
                mortgageAnalysis={mortgageAnalysis}
                currency={currency}
                rate={rate}
              />
            </TabsContent>
          )}

          {/* Tab 5: Wealth */}
          <TabsContent value="wealth" className="mt-0">
            <WealthTab
              inputs={inputs}
              calculations={calculations}
              currency={currency}
              rate={rate}
              unitSizeSqf={clientInfo.unitSizeSqf}
            />
          </TabsContent>

          {/* Tab 6: Post-Handover (conditional) */}
          {showPostHandover && (
            <TabsContent value="posthandover" className="mt-0">
              <PostHandoverTab
                inputs={inputs}
                calculations={calculations}
                currency={currency}
                rate={rate}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Floor Plan Lightbox */}
      {quoteImages.floorPlanUrl && (
        <FloorPlanLightbox
          imageUrl={quoteImages.floorPlanUrl}
          open={floorPlanOpen}
          onOpenChange={setFloorPlanOpen}
        />
      )}

      {/* Wealth Projection Modal */}
      <WealthProjectionModal
        open={wealthModalOpen}
        onOpenChange={setWealthModalOpen}
        basePrice={basePrice}
        constructionMonths={calculations.totalMonths}
        constructionAppreciation={inputs.constructionAppreciation}
        growthAppreciation={inputs.growthAppreciation}
        matureAppreciation={inputs.matureAppreciation}
        growthPeriodYears={inputs.growthPeriodYears}
        bookingYear={inputs.bookingYear}
        rentalYieldPercent={inputs.rentalYieldPercent}
        rentGrowthRate={inputs.rentGrowthRate || 3}
        currency={currency}
        rate={rate}
        handoverMonth={inputs.handoverMonth}
        handoverYear={inputs.handoverYear}
        bookingMonth={inputs.bookingMonth}
      />

      {/* Floating Edit Button */}
      {onEditClick && (
        <div className="fixed bottom-6 right-6 z-50" data-export-hide="true">
          <Button
            size="icon"
            onClick={onEditClick}
            className="h-12 w-12 rounded-full bg-theme-accent text-theme-bg shadow-lg hover:bg-theme-accent/90 transition-all hover:scale-105"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

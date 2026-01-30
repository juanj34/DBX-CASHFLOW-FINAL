import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROIInputModal } from "@/components/roi/ROIInputModal";
import { GrowthCurve } from "@/components/roi/GrowthCurve";
import { InvestorCard } from "@/components/roi/InvestorCard";
import { MetricsPanel } from "@/components/roi/MetricsPanel";
import { YearlyProjectionTable } from "@/components/roi/YearlyProjectionTable";
import { useROICalculations, ROIInputs } from "@/components/roi/useROICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLanguage } from "@/contexts/LanguageContext";

const ROICalculator = () => {
  useDocumentTitle("ROI Calculator");
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<ROIInputs>({
    basePrice: 800000,
    rentalYieldPercent: 8.5,
    appreciationRate: 10,
    bookingMonth: 1,
    bookingYear: 2025,
    handoverMonth: 6,
    handoverYear: 2028,
    resaleThresholdPercent: 40,
    oiHoldingMonths: 30,
  });

  const calculations = useROICalculations(inputs);

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card">
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-accent/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-theme-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme-text">{t('roiInvestorType')}</h1>
                <p className="text-sm text-theme-text-muted">{t('roiCompareProfiles')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outlineDark"
              size="sm"
              onClick={() => setCurrency(c => c === 'AED' ? 'USD' : 'AED')}
            >
              {currency === 'AED' ? '🇦🇪 AED' : '🇺🇸 USD'}
            </Button>
            <Link to="/account-settings">
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <ROIInputModal 
              inputs={inputs} 
              setInputs={setInputs} 
              open={modalOpen}
              onOpenChange={setModalOpen}
              currency={currency}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Cards & Chart */}
          <div className="xl:col-span-2 space-y-8">
            {/* Growth Curve */}
            <GrowthCurve calculations={calculations} inputs={inputs} currency={currency} />

            {/* Investor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InvestorCard type="oi" metrics={calculations.oi} currency={currency} />
              <InvestorCard type="si" metrics={calculations.si} currency={currency} />
              <InvestorCard type="ho" metrics={calculations.ho} currency={currency} />
            </div>

            {/* Comparison Table */}
            <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-theme-border">
                <h3 className="font-semibold text-theme-text">{t('roiDetailedComparison')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-bg-alt">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-muted tracking-wider">{t('roiMetric')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-accent tracking-wider">OI</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-accent-secondary tracking-wider">SI</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-purple-400 tracking-wider">HO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiEntryPrice')}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.oi.entryPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.si.entryPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.ho.entryPrice, currency)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiExitPrice')}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.oi.exitPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.si.exitPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text-muted">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiEquityInvested')}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.oi.equityInvested, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.si.equityInvested, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme-text font-mono">{formatCurrency(calculations.ho.equityInvested, currency)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiProjectedProfit')}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-accent">+{formatCurrency(calculations.oi.projectedProfit, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-accent-secondary">+{formatCurrency(calculations.si.projectedProfit, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text-muted">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roe')}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-accent">{calculations.oi.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-accent-secondary">{calculations.si.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text-muted">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiRentalYield')}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.oi.rentalYield.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.si.rentalYield.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.ho.rentalYield.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-theme-text-muted">{t('roiYearsToPay')}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.oi.yearsToPay.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.si.yearsToPay.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-theme-text">{calculations.ho.yearsToPay.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10-Year Projection Table */}
            <YearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} />
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="xl:col-span-1">
            <MetricsPanel calculations={calculations} inputs={inputs} currency={currency} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ROICalculator;

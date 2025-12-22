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

const ROICalculator = () => {
  useDocumentTitle("ROI Calculator");
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
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Investor Type</h1>
                <p className="text-sm text-gray-400">Compare OI, SI, HO investment profiles</p>
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
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
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
            <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#2a3142]">
                <h3 className="font-semibold text-white">Detailed Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0d1117]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Metric</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#CCFF00] uppercase tracking-wider">OI</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#00EAFF] uppercase tracking-wider">SI</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#FF00FF] uppercase tracking-wider">HO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a3142]">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Entry Price</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.oi.entryPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.si.entryPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.ho.entryPrice, currency)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Exit Price</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.oi.exitPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.si.exitPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Equity Invested</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.oi.equityInvested, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.si.equityInvested, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{formatCurrency(calculations.ho.equityInvested, currency)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Projected Profit</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#CCFF00]">+{formatCurrency(calculations.oi.projectedProfit, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#00EAFF]">+{formatCurrency(calculations.si.projectedProfit, currency)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">ROE</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#CCFF00]">{calculations.oi.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#00EAFF]">{calculations.si.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Rental Yield</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.oi.rentalYield.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.si.rentalYield.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.ho.rentalYield.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Years to Pay</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.oi.yearsToPay.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.si.yearsToPay.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-white">{calculations.ho.yearsToPay.toFixed(1)}</td>
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

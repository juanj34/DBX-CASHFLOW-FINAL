import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROIInputModal } from "@/components/roi/ROIInputModal";
import { GrowthCurve } from "@/components/roi/GrowthCurve";
import { InvestorCard } from "@/components/roi/InvestorCard";
import { MetricsPanel } from "@/components/roi/MetricsPanel";
import { useROICalculations, ROIInputs } from "@/components/roi/useROICalculations";

const ROICalculator = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputs, setInputs] = useState<ROIInputs>({
    basePrice: 800000,
    annualRent: 107000,
    equityPercent: 50,
    appreciationRate: 10,
    holdingPeriodMonths: 24,
  });

  const calculations = useROICalculations(inputs);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/map">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Investment Analysis</h1>
                <p className="text-sm text-gray-400">Dubai Real Estate ROI Calculator</p>
              </div>
            </div>
          </div>
          <ROIInputModal 
            inputs={inputs} 
            setInputs={setInputs} 
            open={modalOpen}
            onOpenChange={setModalOpen}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Cards & Chart */}
          <div className="xl:col-span-2 space-y-8">
            {/* Growth Curve */}
            <GrowthCurve calculations={calculations} inputs={inputs} />

            {/* Investor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InvestorCard type="oi" metrics={calculations.oi} />
              <InvestorCard type="si" metrics={calculations.si} />
              <InvestorCard type="ho" metrics={calculations.ho} />
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
                      <td className="px-4 py-3 text-sm text-gray-400">Property Value</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.oi.propertyValue)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.si.propertyValue)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.ho.propertyValue)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Equity Invested</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.oi.equityInvested)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.si.equityInvested)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white font-mono">{new Intl.NumberFormat('en-AE').format(calculations.ho.equityInvested)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">Projected Profit</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#CCFF00]">+{new Intl.NumberFormat('en-AE').format(calculations.oi.projectedProfit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#00EAFF]">+{new Intl.NumberFormat('en-AE').format(calculations.si.projectedProfit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">-</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-400">ROE</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#CCFF00]">{calculations.oi.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#00EAFF]">{calculations.si.roe.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">-</td>
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
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="xl:col-span-1">
            <MetricsPanel calculations={calculations} inputs={inputs} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ROICalculator;

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Rocket, ChevronDown, ChevronUp, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIExitScenariosTable } from "@/components/roi/OIExitScenariosTable";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { useOICalculations, OIInputs, OIExitScenario } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

const OICalculator = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>({
    basePrice: 800000,
    rentalYieldPercent: 8.5,
    appreciationRate: 10,
    bookingMonth: 1,
    bookingYear: 2025,
    handoverMonth: 6,
    handoverYear: 2028,
    minimumExitThreshold: 30,
    paymentMilestones: [
      { constructionPercent: 0, paymentPercent: 10 },
      { constructionPercent: 10, paymentPercent: 5 },
      { constructionPercent: 20, paymentPercent: 5 },
      { constructionPercent: 30, paymentPercent: 5 },
      { constructionPercent: 40, paymentPercent: 5 },
      { constructionPercent: 50, paymentPercent: 0 },
      { constructionPercent: 60, paymentPercent: 0 },
      { constructionPercent: 70, paymentPercent: 0 },
      { constructionPercent: 80, paymentPercent: 0 },
      { constructionPercent: 90, paymentPercent: 0 },
      { constructionPercent: 100, paymentPercent: 70 },
    ],
    // Entry Costs
    dldFeePercent: 4,
    oqoodFeePercent: 4,
    adminFee: 5000,
    buyerAgentPercent: 0,
    // Exit Costs
    nocFee: 2000,
    transferFeePercent: 2,
    sellerAgentPercent: 0,
  });

  const calculations = useOICalculations(inputs);
  const [holdAnalysisOpen, setHoldAnalysisOpen] = useState(false);

  // Find best TRUE ROE scenario (accounting for costs)
  const bestROEScenario = calculations.scenarios.reduce<OIExitScenario | null>(
    (best, current) => (!best || current.trueROE > best.trueROE ? current : best),
    null
  );

  // Find handover scenario (100%)
  const handoverScenario = calculations.scenarios.find(s => s.exitPercent === 100);

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
                <Rocket className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Opportunity Investor Analysis</h1>
                <p className="text-sm text-gray-400">ROE at different exit points</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrency(c => c === 'AED' ? 'USD' : 'AED')}
              className="border-[#2a3142] text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
            >
              {currency === 'AED' ? '🇦🇪 AED' : '🇺🇸 USD'}
            </Button>
            <OIInputModal 
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
          {/* Left Column - Charts & Tables */}
          <div className="xl:col-span-2 space-y-8">
            {/* Growth Curve */}
            <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} />

            {/* Exit Scenarios Table */}
            <OIExitScenariosTable scenarios={calculations.scenarios} currency={currency} />

            {/* 10-Year Projection Table */}
            <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} />
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="xl:col-span-1">
            <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Investment Summary</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Base Property Price</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {formatCurrency(inputs.basePrice, currency)}
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Minimum Exit Threshold</div>
                  <div className="text-xl font-bold text-[#CCFF00] font-mono">
                    {inputs.minimumExitThreshold}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    First exit at {inputs.minimumExitThreshold}% construction
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Construction Period</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {calculations.totalMonths} months
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {inputs.bookingMonth}/{inputs.bookingYear} → {inputs.handoverMonth}/{inputs.handoverYear}
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Appreciation Rate (CAGR)</div>
                  <div className="text-xl font-bold text-[#CCFF00] font-mono">
                    {inputs.appreciationRate}%
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Rental Yield</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {inputs.rentalYieldPercent}%
                  </div>
                </div>

                {/* Entry Costs Summary */}
                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Total Entry Costs</div>
                  <div className="text-xl font-bold text-red-400 font-mono">
                    -{formatCurrency(calculations.totalEntryCosts, currency)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    DLD {inputs.dldFeePercent}% + Oqood {inputs.oqoodFeePercent}% + Admin
                  </div>
                </div>

                {/* Best ROE Highlight */}
                {bestROEScenario && (
                  <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl">
                    <div className="text-xs text-[#CCFF00] mb-1">Best True ROE ({bestROEScenario.exitPercent}% Exit)</div>
                    <div className="text-2xl font-bold text-[#CCFF00] font-mono">
                      {bestROEScenario.trueROE.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      True Profit: {formatCurrency(bestROEScenario.trueProfit, currency)} en {bestROEScenario.exitMonths} meses
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Capital Deployed: {formatCurrency(bestROEScenario.totalCapitalDeployed, currency)}
                    </div>
                  </div>
                )}

                {/* 100% Exit */}
                {handoverScenario && (
                  <div className="p-4 bg-[#0d1117] rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">True ROE at Handover (100%)</div>
                    <div className="text-xl font-bold text-white font-mono">
                      {handoverScenario.trueROE.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      True Profit: {formatCurrency(handoverScenario.trueProfit, currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Exit Costs: {formatCurrency(handoverScenario.exitCosts, currency)}
                    </div>
                  </div>
                )}

                {/* Hold Analysis - Collapsible */}
                <div className="border border-[#2a3142] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setHoldAnalysisOpen(!holdAnalysisOpen)}
                    className="w-full p-4 flex items-center justify-between bg-[#0d1117] hover:bg-[#161b26] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">If You HOLD After Handover</span>
                    </div>
                    {holdAnalysisOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {holdAnalysisOpen && (
                    <div className="p-4 space-y-3 bg-[#0d1117]/50">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Capital Total Invertido</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.totalCapitalInvested, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Valor al Handover</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.propertyValueAtHandover, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Renta Anual Estimada</span>
                        <span className="text-sm text-[#CCFF00] font-mono">
                          {formatCurrency(calculations.holdAnalysis.annualRent, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Rental Yield vs Inversión</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Años para Recuperar</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.yearsToBreakEven.toFixed(1)} años
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#2a3142]">
                        <p className="text-xs text-gray-500">
                          💡 Si vendes al {bestROEScenario?.exitPercent}%, tu ROE es {bestROEScenario?.roe.toFixed(1)}% con solo {formatCurrency(bestROEScenario?.equityDeployed || 0, currency)} de capital
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation to Full Calculator */}
              <div className="mt-6 pt-4 border-t border-[#2a3142]">
                <Link to="/roi-calculator">
                  <Button 
                    variant="outline" 
                    className="w-full border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white"
                  >
                    Full ROI Calculator (OI → SI → HO)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OICalculator;

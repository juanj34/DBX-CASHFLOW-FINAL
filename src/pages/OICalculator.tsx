import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Rocket, ChevronDown, ChevronUp, Home, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { useOICalculations, OIInputs, OIExitScenario } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency, CURRENCY_CONFIG } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";

const OICalculator = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>({
    basePrice: 800000,
    rentalYieldPercent: 8.5,
    appreciationRate: 10,
    bookingMonth: 1, // January
    bookingYear: 2025,
    handoverQuarter: 4, // Q4
    handoverYear: 2027,
    // Restructured payment plan
    downpaymentPercent: 20,        // 20% at booking
    preHandoverPercent: 20,        // 20/80 split (20% pre-handover, 80% handover)
    additionalPayments: [],        // No additional payments for 20/80
    // Entry Costs (simplified - DLD fixed at 4%)
    eoiFee: 50000, // EOI / Booking fee
    oqoodFee: 5000,
  });

  // Custom exit scenarios (months)
  const [exitScenarios, setExitScenarios] = useState<[number, number, number]>([18, 30, 36]);

  const calculations = useOICalculations(inputs);
  const { rate, isLive } = useExchangeRate(currency);
  const [holdAnalysisOpen, setHoldAnalysisOpen] = useState(false);

  // Find best TRUE ROE scenario
  const bestROEScenario = calculations.scenarios.reduce<OIExitScenario | null>(
    (best, current) => (!best || current.trueROE > best.trueROE ? current : best),
    null
  );

  // Find handover scenario
  const handoverScenario = calculations.scenarios.find(s => s.exitMonths === calculations.totalMonths);

  // Month names for display
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
                <p className="text-sm text-gray-400">Exit scenarios & payment breakdown</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live rate indicator */}
            {currency !== 'AED' && (
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>1 AED = {rate.toFixed(4)} {currency}</span>
              </div>
            )}
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="w-[130px] border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">
                    {config.flag} {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />

            {/* Exit Scenarios Cards */}
            <ExitScenariosCards 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              basePrice={calculations.basePrice}
              totalEntryCosts={calculations.totalEntryCosts}
              exitScenarios={exitScenarios}
              onExitScenariosChange={setExitScenarios}
              rate={rate}
            />

            {/* Payment Breakdown */}
            <PaymentBreakdown 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              rate={rate}
            />

            {/* 10-Year Projection Table */}
            <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} />
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="xl:col-span-1">
            <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Investment Summary</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Base Property Price</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {formatCurrency(inputs.basePrice, currency, rate)}
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Payment Plan</div>
                  <div className="text-xl font-bold text-[#CCFF00] font-mono">
                    {inputs.preHandoverPercent}/{100 - inputs.preHandoverPercent}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Downpayment: {inputs.downpaymentPercent}% + {inputs.additionalPayments.length} additional
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Construction Period</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {calculations.totalMonths} months
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {monthNames[inputs.bookingMonth - 1]} {inputs.bookingYear} → Q{inputs.handoverQuarter} {inputs.handoverYear}
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
                    -{formatCurrency(calculations.totalEntryCosts, currency, rate)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    DLD 4% + Oqood {formatCurrency(inputs.oqoodFee, currency, rate)}
                  </div>
                </div>

                {/* Best ROE Highlight */}
                {bestROEScenario && (
                  <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl">
                    <div className="text-xs text-[#CCFF00] mb-1">Best ROE ({bestROEScenario.exitMonths} months)</div>
                    <div className="text-2xl font-bold text-[#CCFF00] font-mono">
                      {bestROEScenario.trueROE.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Profit: {formatCurrency(bestROEScenario.trueProfit, currency, rate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Capital: {formatCurrency(bestROEScenario.totalCapitalDeployed, currency, rate)}
                    </div>
                  </div>
                )}

                {/* Handover */}
                {handoverScenario && (
                  <div className="p-4 bg-[#0d1117] rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">At Handover ({handoverScenario.exitMonths} months)</div>
                    <div className="text-xl font-bold text-white font-mono">
                      {formatCurrency(handoverScenario.exitPrice, currency, rate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Profit: {formatCurrency(handoverScenario.trueProfit, currency, rate)}
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
                        <span className="text-xs text-gray-400">Total Capital Invested</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.totalCapitalInvested, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Value at Handover</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.propertyValueAtHandover, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Annual Rent (Est.)</span>
                        <span className="text-sm text-[#CCFF00] font-mono">
                          {formatCurrency(calculations.holdAnalysis.annualRent, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Rental Yield on Investment</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Years to Break Even</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.yearsToBreakEven.toFixed(1)} years
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#2a3142]">
                        <p className="text-xs text-gray-500">
                          💡 Holding means full property payment + rental income
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

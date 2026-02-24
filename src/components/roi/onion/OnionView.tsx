import React, { useMemo } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { calculateExitScenario } from "@/components/roi/constructionProgress";

interface OnionViewProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  quoteImages?: {
    heroImageUrl?: string | null;
    floorPlanUrl?: string | null;
    buildingRenderUrl?: string | null;
  };
  currency: Currency;
  rate: number;
  language?: string;
  onEditClick?: () => void;
}

export const OnionView = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  quoteImages,
  currency,
  rate,
  onEditClick,
}: OnionViewProps) => {
  const { t } = useLanguage();

  // --- DATA PREPARATION ---

  const basePrice = calculations.basePrice;
  const projectName = clientInfo?.projectName || inputs.snapshotTitle || "Project Name";
  const eoiFee = inputs.eoiFee || 0;

  // Downpayment (SPA) calculation: Downpayment % minus EOI amount (if EOI is counted towards DP). 
  // For simplicity based on typical Dubai plans:
  const dpPercent = inputs.downpaymentPercent || 20;
  const dpTotal = (basePrice * dpPercent) / 100;
  const spaPayment = Math.max(0, dpTotal - eoiFee);

  const dldFee = basePrice * 0.04;
  const adminFee = inputs.oqoodFee || 0;

  // Day 1 / Reservation Total
  const totalDay1 = dpTotal + dldFee + adminFee;

  // Additional Deposits (Installments during construction)
  const additionalPayments = inputs.additionalPayments || [];
  const totalInstallments = additionalPayments.reduce((sum, p) => sum + (basePrice * (p.paymentPercent || 0) / 100), 0);

  // Handover payment
  const handoverPct = inputs.hasPostHandoverPlan
    ? (inputs.onHandoverPercent || 0)
    : (100 - (inputs.preHandoverPercent || 0));
  const handoverPayment = basePrice * handoverPct / 100;

  // Total Equity Required
  // If no mortgage, equity is 100% of price plus DLD/Admin. 
  // If mortgage, equity is the downpayment + installments + gap.
  // We'll use the calculations object:
  const totalEquityRequired = calculations.totalEntryCosts + calculations.totalHandoverCosts;
  // Or simply: totalDay1 + totalInstallments + handoverPayment
  const totalCashNeeded = totalDay1 + totalInstallments + handoverPayment;

  // Income calculations
  const grossMonthlyRent = inputs.expectedAnnualRent ? inputs.expectedAnnualRent / 12 : (basePrice * (inputs.rentalYieldPercent || 0) / 100) / 12;
  const grossYield = basePrice > 0 ? ((grossMonthlyRent * 12) / basePrice) : 0;

  const serviceChargeSqft = inputs.serviceChargePerSqft || 18;
  const unitSize = inputs.unitSizeSqf || 0;
  const monthlyServiceCharge = (serviceChargeSqft * unitSize) / 12;

  const netMonthlyIncome = grossMonthlyRent - monthlyServiceCharge;
  const netYield = basePrice > 0 ? ((netMonthlyIncome * 12) / basePrice) : 0;

  // Formatting helpers specifically for the spreadsheet
  const formatSpreadsheet = (val: number, isCurrency = true) => {
    if (val === 0) return "-";
    // Usually spreadsheet shows negative for cash outflows
    const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return isCurrency ? formatted : formatted;
  };

  const formatOutput = (val: number, currList: Currency) => {
    return formatCurrency(val, currList, rate);
  };

  // Safe wrapper for number to locale string
  const n2s = (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-full bg-white text-slate-900 p-8 pt-4 pb-20 font-sans overflow-x-auto">
      <div className="max-w-[1100px] mx-auto min-w-[900px]">
        {/* --- HEADER ROW --- */}
        <div className="flex justify-between items-start mb-6">

          {/* Top Left: Client Info Table */}
          <div className="w-[30%] text-[10px]">
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr>
                  <th colSpan={2} className="bg-black text-white py-1 px-2 text-center border border-black uppercase font-bold tracking-wide">
                    CLIENT AND UNIT INFORMATION
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Developer</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.developer || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Client Name</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.clients?.[0]?.name || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Client Country</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.clients?.[0]?.country || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Name of Broker</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.brokerName || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Unit</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.unit || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Unit size (sqf)</td>
                  <td className="py-1 px-2 text-center">{n2s(inputs.unitSizeSqf || 0)}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Unit type (beds)</td>
                  <td className="py-1 px-2 text-center">{clientInfo?.unitType || '-'}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Purchase price</td>
                  <td className="py-1 px-2 text-center font-bold bg-slate-50">{n2s(basePrice)}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Conversion from to</td>
                  <td className="py-1 px-2 text-center">{currency}</td>
                </tr>
                <tr className="border-[0.5px] border-black">
                  <td className="bg-slate-100 py-1 px-2 font-semibold">Converted Property Value</td>
                  <td className="py-1 px-2 text-center font-bold bg-slate-50">{n2s(basePrice * rate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Top Center: Title & Snapshot */}
          <div className="w-[40%] flex flex-col items-center pt-2">
            <h1 className="text-xl font-bold uppercase underline underline-offset-4 mb-2">Monthly Cashflow Statement</h1>
            <h2 className="text-lg font-bold uppercase underline underline-offset-4 mb-6 text-slate-800">{projectName}</h2>

            {/* Snapshot Table */}
            <table className="w-full text-[10px] border-collapse border border-black shadow-sm">
              <thead>
                <tr>
                  <th colSpan={2} className="bg-black text-white text-center py-1 font-bold uppercase tracking-wider">
                    SNAPSHOT
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="py-1 px-2">Payment on SPA</td>
                  <td className="py-1 px-2 text-right">({n2s(totalDay1)}) AED</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1 px-2 bg-slate-50">Additional Deposits</td>
                  <td className="py-1 px-2 text-right bg-slate-50">({n2s(totalInstallments)}) AED</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1 px-2">Payment on Handover</td>
                  <td className="py-1 px-2 text-right">({n2s(handoverPayment)}) AED</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold bg-slate-200 border-r border-black">Total Equity Required</td>
                  <td className="py-1 px-2 text-right font-bold bg-slate-200">({n2s(totalCashNeeded)}) AED</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Top Right: Logo & ROI */}
          <div className="w-[25%] flex flex-col items-end">
            {quoteImages?.heroImageUrl ? (
              <img src={quoteImages.heroImageUrl} alt="Logo" className="h-16 object-contain mb-8 mix-blend-multiply" />
            ) : (
              <div className="h-16 mb-8 w-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">Logo / Hero Image</div>
            )}

            {/* Projected ROI Table */}
            <table className="w-full text-[10px] border-collapse border border-black shadow-sm">
              <thead>
                <tr>
                  <th colSpan={3} className="bg-black text-white text-center py-1 font-bold uppercase tracking-wider">
                    PROJECTED ROI
                  </th>
                </tr>
                <tr className="bg-orange-400 text-white border-b border-black">
                  <th className="py-1 px-2 bg-slate-100 border-r border-black"></th>
                  <th className="py-1 px-2 bg-slate-100 border-r border-black"></th>
                  <th className="py-1 px-2 text-right font-bold">Sales Price</th>
                </tr>
              </thead>
              <tbody>
                {exitScenarios.slice(0, 2).map((months, i) => {
                  const scenario = calculateExitScenario(months, basePrice, calculations.totalMonths, inputs, totalCashNeeded);
                  return (
                    <tr key={i} className="border-b border-black">
                      <td className="py-1 px-2 border-r border-black bg-slate-50 font-semibold">{months} Months</td>
                      <td className="py-1 px-2 border-r border-black text-center">{scenario.trueROE.toFixed(1)}%</td>
                      <td className="py-1 px-2 text-right bg-slate-50 font-mono">AED {n2s(scenario.exitPrice)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- SECTION A: INITIAL COST --- */}
        <div className="mb-6 text-[10px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-1 px-2 text-left font-bold w-[35%]">A. Initial Cost</th>
                <th className="py-1 px-2 w-[15%]"></th>
                <th className="py-1 px-2 text-center underline w-[15%]">AED</th>
                <th className="py-1 px-2 text-center underline w-[15%]">{currency}</th>
                <th className="py-1 px-2 text-right text-xs w-[20%]">Additional Notes</th>
              </tr>
            </thead>
            <tbody>
              {/* Rows */}
              {eoiFee > 0 && (
                <tr>
                  <td className="py-1 px-2">A1. Holding Fee</td>
                  <td className="py-1 px-2 text-center">{n2s(eoiFee)} Holding Fee</td>
                  <td className="py-1 px-2 text-center">({n2s(eoiFee)}) AED</td>
                  <td className="py-1 px-2 text-center">({n2s(eoiFee * rate)}) {currency}</td>
                  <td className="py-1 px-2 text-right text-[8px] text-slate-500 leading-tight row-span-4 align-top pt-2">
                    Accepted currencies AED only. Other currencies spot rate from time of issue and subject to change.
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-1 px-2">A2. Signed Purchase Agreement</td>
                <td className="py-1 px-2 text-center">{dpPercent}% Of Property Value</td>
                <td className="py-1 px-2 text-center">({n2s(spaPayment)}) AED</td>
                <td className="py-1 px-2 text-center">({n2s(spaPayment * rate)}) {currency}</td>
                {eoiFee === 0 && <td className="py-1 px-2 text-right text-[8px] text-slate-500 leading-tight row-span-3 align-top pt-2">
                  Accepted currencies AED only. Other currencies spot rate from time of issue and subject to change.
                </td>}
              </tr>
              <tr>
                <td className="py-1 px-2">A3. Dubai Land Department Fee</td>
                <td className="py-1 px-2 text-center">4% Of Property Value</td>
                <td className="py-1 px-2 text-center">({n2s(dldFee)}) AED</td>
                <td className="py-1 px-2 text-center">({n2s(dldFee * rate)}) {currency}</td>
              </tr>
              {adminFee > 0 && (
                <tr>
                  <td className="py-1 px-2">A4. Oqood Fees (Pre title deed)</td>
                  <td className="py-1 px-2 text-center">{n2s(adminFee)} Admin Fee</td>
                  <td className="py-1 px-2 text-center">({n2s(adminFee)}) AED</td>
                  <td className="py-1 px-2 text-center">({n2s(adminFee * rate)}) {currency}</td>
                </tr>
              )}
              {/* Subtotal A */}
              <tr className="bg-slate-100 font-bold border-t border-b border-black">
                <td colSpan={2} className="py-2 px-2 text-right pr-8">Payment on Reservation and Exchange</td>
                <td className="py-2 px-2 text-center text-slate-700">({n2s(totalDay1)}) AED</td>
                <td className="py-2 px-2 text-center text-slate-700">({n2s(totalDay1 * rate)}) {currency}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- SECTION B: MILESTONE EVENT --- */}
        <div className="mb-6 text-[10px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-1 px-2 text-left font-bold w-[35%]">B. MILESTONE EVENT</th>
                <th className="py-1 px-2 w-[15%]"></th>
                <th className="py-1 px-2 w-[15%]"></th>
                <th className="py-1 px-2 w-[15%]"></th>
                <th className="py-1 px-2 text-right text-xs w-[20%]">Additional Notes</th>
              </tr>
            </thead>
            <tbody>
              {/* Installments */}
              {additionalPayments.map((p, i) => {
                const amount = basePrice * (p.paymentPercent || 0) / 100;
                return (
                  <tr key={i}>
                    <td className="py-1 px-2">{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Installment</td>
                    <td className="py-1 px-2 text-center block max-w-[200px] truncate mx-auto">{p.paymentPercent}% {p.milestoneName || 'Construction milestone'}</td>
                    <td className="py-1 px-2 text-center">({n2s(amount)}) AED</td>
                    <td className="py-1 px-2 text-center">({n2s(amount * rate)}) {currency}</td>
                    <td></td>
                  </tr>
                );
              })}

              {/* Handover */}
              <tr className="bg-emerald-50 border-y border-emerald-100">
                <td className="py-2 px-2 font-bold">Payment On Completion (Estimated)</td>
                <td className="py-2 px-2 text-center font-bold">{handoverPct}% of Purchase Price</td>
                <td className="py-2 px-2 text-center font-bold text-emerald-700">({n2s(handoverPayment)}) AED</td>
                <td className="py-2 px-2 text-center font-bold text-emerald-700">({n2s(handoverPayment * rate)}) {currency}</td>
                <td></td>
              </tr>

              {/* Total Equity Required */}
              <tr className="bg-orange-400 text-white font-bold text-xs">
                <td colSpan={2} className="py-2 px-2 text-right pr-8">Total Equity Required</td>
                <td className="py-2 px-2 text-center">({n2s(totalCashNeeded)}) AED</td>
                <td className="py-2 px-2 text-center">({n2s(totalCashNeeded * rate)}) {currency}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- SECTION C: PROJECT MONTHLY NET INCOME --- */}
        <div className="mb-6 text-[10px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th colSpan={4} className="py-1 px-2 text-left font-bold">C. PROJECT MONTHLY NET INCOME</th>
                <th className="py-1 px-2 text-right text-xs w-[20%]">Additional Notes</th>
              </tr>
            </thead>
            <tbody>
              {/* Gross Income */}
              <tr className="bg-slate-100 border-b border-white">
                <td colSpan={2} className="py-2 px-2 text-right font-medium pr-8">i Estimated Gross Monthly Rental Income</td>
                <td className="py-2 px-2 text-center w-[15%]">{n2s(grossMonthlyRent)} AED</td>
                <td className="py-2 px-2 text-center w-[15%]">{n2s(grossMonthlyRent * rate)} {currency}</td>
                <td className="w-[20%]"></td>
              </tr>
              <tr className="bg-cyan-500 text-white font-bold border-b-2 border-white">
                <td colSpan={2} className="py-1 px-2 text-right pr-8">Gross Yield</td>
                <td className="py-1 px-2 text-center w-[15%] bg-cyan-500">{(grossYield * 100).toFixed(1)}%</td>
                <td className="py-1 px-2 text-center w-[15%] bg-cyan-500">{(grossYield * 100).toFixed(1)}%</td>
                <td className="w-[20%] bg-white"></td>
              </tr>

              {/* Expenses */}
              <tr>
                <td colSpan={4} className="py-1 px-2 text-center text-slate-500 italic">Net Monthly Expenses</td>
                <td></td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 px-2 font-medium w-[35%]">C1. Service charge (PSFT)</td>
                <td className="py-1 px-2 text-center w-[15%]">AED{serviceChargeSqft}.00 Per year</td>
                <td className="py-1 px-2 text-center w-[15%]">({n2s(monthlyServiceCharge)}) AED</td>
                <td className="py-1 px-2 text-center w-[15%]">({n2s(monthlyServiceCharge * rate)}) {currency}</td>
                <td></td>
              </tr>

              {/* Net Income */}
              <tr className="bg-slate-100 border-b border-white">
                <td colSpan={2} className="py-2 px-2 text-right font-bold pr-8">ii Net Monthly Income</td>
                <td className="py-2 px-2 text-center font-bold w-[15%]">{n2s(netMonthlyIncome)} AED</td>
                <td className="py-2 px-2 text-center font-bold w-[15%]">{n2s(netMonthlyIncome * rate)} {currency}</td>
                <td></td>
              </tr>
              <tr className="bg-cyan-500 text-white font-bold">
                <td colSpan={2} className="py-1 px-2 text-right pr-8">Net Yield</td>
                <td className="py-1 px-2 text-center w-[15%] bg-cyan-500">{(netYield * 100).toFixed(1)}%</td>
                <td className="py-1 px-2 text-center w-[15%] bg-cyan-500">{(netYield * 100).toFixed(1)}%</td>
                <td className="bg-white"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- SECTION D: ANNUAL NET CASH POSITION --- */}
        <div className="mb-8 text-[10px]">
          <div className="bg-cyan-500 text-white font-bold uppercase py-1 px-4 mb-4 inline-block w-2/3">
            ANNUAL NET ANNUAL CASH POSITION
          </div>

          <div className="w-full max-w-3xl ml-4">
            <table className="w-full border-collapse border border-black mb-4">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-[15%] border-r border-black"></th>
                  <th className="w-[5%] border-r border-black"></th>
                  <th className="text-center py-1">Year 1</th>
                  <th className="text-center py-1">Year 2</th>
                  <th className="text-center py-1">Year 3</th>
                  <th className="text-center py-1">Year 4</th>
                  <th className="text-center py-1">Year 5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black font-semibold px-2 py-1">Net Annual Cash Position</td>
                  <td className="border-r border-black text-center font-medium">AED</td>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <td key={i} className="text-center py-1 border-l border-slate-300">
                      {n2s((netMonthlyIncome * 12) * Math.pow(1 + (inputs.annualRentIncrease || 5) / 100, i))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-[15%] border-r border-black"></th>
                  <th className="w-[5%] border-r border-black"></th>
                  <th className="text-center py-1">Year 6</th>
                  <th className="text-center py-1">Year 7</th>
                  <th className="text-center py-1">Year 8</th>
                  <th className="text-center py-1">Year 9</th>
                  <th className="text-center py-1">Year 10</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black font-semibold px-2 py-1">Net Annual Cash Position</td>
                  <td className="border-r border-black text-center font-medium">AED</td>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <td key={i} className="text-center py-1 border-l border-slate-300">
                      {n2s((netMonthlyIncome * 12) * Math.pow(1 + (inputs.annualRentIncrease || 5) / 100, i + 5))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {onEditClick && (
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          <Button
            size="icon"
            onClick={onEditClick}
            className="h-12 w-12 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

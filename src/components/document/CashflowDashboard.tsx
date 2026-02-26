import React, { useMemo } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { calculateExitScenario, ExitScenarioResult, isHandoverExit } from '@/components/roi/constructionProgress';
import { DocumentControls, Currency } from './DocumentControls';

interface ClientUnitData {
  developer?: string;
  projectName?: string;
  clientName?: string;
  clientCountry?: string;
  brokerName?: string;
  unitType?: string;
  unitSize?: number;
}

interface MortgageData {
  enabled: boolean;
  loanAmount: number;
  monthlyPayment: number;
  financingPercent: number;
  loanTermYears: number;
  interestRate: number;
}

interface CashflowDashboardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo?: ClientUnitData;
  exitScenarios?: number[];
  currency?: Currency;
  rate?: number;
  language?: string;
  exportMode?: boolean;
  mortgageData?: MortgageData;
  brokerLogoUrl?: string;
  setCurrency?: (c: Currency) => void;
  setLanguage?: (l: string) => void;
  advisorInfo?: { name?: string; email?: string; photoUrl?: string; phone?: string };
}

// Number formatting
const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;
const shortDate = (m: number, y: number) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[(m - 1) % 12]} ${y}`;
};
const SQF_TO_M2 = 0.092903;

export const CashflowDashboard: React.FC<CashflowDashboardProps> = ({
  inputs,
  calculations,
  clientInfo,
  exitScenarios: exitScenarioMonths,
  currency = 'AED',
  rate = 1,
  language = 'en',
  exportMode = false,
  mortgageData,
  brokerLogoUrl,
  setCurrency,
  setLanguage,
  advisorInfo,
}) => {
  const { basePrice, totalMonths, yearlyProjections, holdAnalysis, totalEntryCosts } = calculations;
  const dldFee = basePrice * 0.04;
  const showCurrencyCol = currency !== 'AED';
  const resellThreshold = (inputs as any).resellEligiblePercent ?? 30;
  const mortgageThreshold = (inputs as any).mortgageEligiblePercent ?? 50;
  const cv = (aed: number) => currency === 'AED' ? aed : aed * rate;
  const cvf = (aed: number) => n2s(cv(aed));

  // Exit scenarios
  const scenarioMonths = exitScenarioMonths || inputs._exitScenarios || [];
  const exitResults = useMemo(() => {
    return scenarioMonths.map((m) =>
      calculateExitScenario(m, basePrice, totalMonths, inputs, totalEntryCosts)
    );
  }, [scenarioMonths, basePrice, totalMonths, inputs, totalEntryCosts]);

  // Exit label: check Pre-Handover before Handover (isHandoverExit has ±1 tolerance)
  const getExitLabel = (months: number) => {
    if (months === totalMonths - 1) return 'Pre-Handover';
    if (months === totalMonths || isHandoverExit(months, totalMonths)) return 'Handover';
    if (months < totalMonths) return `${months} mo`;
    const yearsAfter = Math.round((months - totalMonths) / 12);
    if (yearsAfter > 0) return `Yr ${yearsAfter} Hold`;
    return `+${months - totalMonths}m`;
  };

  const getDisplay = (sc: ExitScenarioResult) => ({
    profit: sc.exitCosts > 0 ? sc.netProfit : sc.trueProfit,
    totalROE: sc.exitCosts > 0 ? sc.netROE : sc.trueROE,
  });

  // Date helper
  const fmtDate = (d: Date) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Section B: installments + completion only (downpayment is in Section A)
  const paymentRows = useMemo(() => {
    const rows: { label: string; percent: number; amount: number; date: string; isCompletion?: boolean; badges: string[] }[] = [];
    const bookDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    let cum = inputs.downpaymentPercent;
    let resellShown = cum >= resellThreshold;
    let mortgageShown = cum >= mortgageThreshold;

    inputs.additionalPayments.forEach((m, i) => {
      if (m.paymentPercent <= 0) return;
      cum += m.paymentPercent;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push('Resale'); resellShown = true; }
      if (!mortgageShown && cum >= mortgageThreshold) { badges.push('Mortgage'); mortgageShown = true; }

      let dateStr: string;
      if (m.type === 'time') {
        const d = new Date(bookDate);
        d.setMonth(d.getMonth() + m.triggerValue);
        dateStr = fmtDate(d);
      } else if (m.type === 'construction') {
        const hoDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
        const totalMs = hoDate.getTime() - bookDate.getTime();
        const d = new Date(bookDate.getTime() + totalMs * (m.triggerValue / 100));
        dateStr = `~${fmtDate(d)} (${m.triggerValue}%)`;
      } else {
        const hoDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
        const d = new Date(hoDate);
        d.setMonth(d.getMonth() + m.triggerValue);
        dateStr = `${fmtDate(d)} Post-HO`;
      }
      rows.push({
        label: m.label || `Installment ${i + 1}`,
        percent: m.paymentPercent,
        amount: basePrice * m.paymentPercent / 100,
        date: dateStr,
        badges,
      });
    });

    const handoverPercent = 100 - inputs.downpaymentPercent - inputs.additionalPayments.reduce((s, p) => s + p.paymentPercent, 0);
    if (handoverPercent > 0.5) {
      cum += handoverPercent;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push('Resale'); resellShown = true; }
      if (!mortgageShown && cum >= mortgageThreshold) { badges.push('Mortgage'); mortgageShown = true; }
      rows.push({
        label: 'Completion Payment',
        percent: Math.round(handoverPercent * 10) / 10,
        amount: basePrice * handoverPercent / 100,
        date: `${shortDate(inputs.handoverMonth, inputs.handoverYear)} Handover`,
        isCompletion: true,
        badges,
      });
    }
    return rows;
  }, [inputs, basePrice, resellThreshold, mortgageThreshold]);

  // Total Equity = property price + all entry costs
  const totalEquity = basePrice + totalEntryCosts;

  // Rental
  const grossYield = inputs.rentalYieldPercent;
  const grossAnnualRent = basePrice * grossYield / 100;
  const grossMonthlyRent = grossAnnualRent / 12;
  const serviceChargePSF = (inputs as any).serviceChargePerSqft || 18;
  const unitSqf = clientInfo?.unitSize || inputs.unitSizeSqf || 0;
  const annualServiceCharge = unitSqf * serviceChargePSF;
  const monthlyServiceCharge = annualServiceCharge / 12;
  const netMonthlyIncome = grossMonthlyRent - monthlyServiceCharge;
  const netAnnualIncome = grossAnnualRent - annualServiceCharge;
  const netYield = basePrice > 0 ? (netAnnualIncome / basePrice) * 100 : 0;

  // Yearly projections (rental years only)
  const rentalYears = yearlyProjections.filter(p => !p.isConstruction);

  // Section header
  const sectionBar = (letter: string, title: string) => (
    <div className="flex items-center gap-2 py-1.5 px-3 bg-[#B3893A]">
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[9px] font-bold">{letter}</span>
      <span className="text-[10px] font-bold text-white tracking-wider uppercase">{title}</span>
    </div>
  );

  // Table cell styles
  const tc = "py-1 px-2 text-[10px] whitespace-nowrap";
  const th = "py-1 px-2 text-[8px] font-semibold text-white uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="w-full bg-white text-gray-900 font-body text-[11px] select-text border border-gray-200 rounded-xl overflow-hidden shadow-md">

      {/* ========== CONTROLS + LOGO/ADVISOR BAR ========== */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-gray-100 print:hidden">
        {/* Logo */}
        <div className={!brokerLogoUrl ? (exportMode ? 'hidden' : '') : ''}>
          {brokerLogoUrl ? (
            <img src={brokerLogoUrl} alt="Company logo" className="h-[36px] w-auto max-w-[120px] object-contain" />
          ) : (
            <a
              href="/account"
              className="h-[36px] w-[100px] border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-[#B3893A]/40 hover:bg-[#B3893A]/5 transition-colors cursor-pointer"
              data-export-hide
              title="Upload your logo in Account Settings"
            >
              <span className="text-[9px] text-gray-400">+ Logo</span>
            </a>
          )}
        </div>
        {/* Advisor */}
        {advisorInfo && (advisorInfo.name || advisorInfo.email) && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              {advisorInfo.photoUrl ? (
                <img src={advisorInfo.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0" />
              ) : advisorInfo.name ? (
                <div className="w-7 h-7 rounded-full bg-[#B3893A]/15 border border-[#B3893A]/30 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-semibold text-[#B3893A]">
                    {advisorInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
              ) : null}
              <div>
                {advisorInfo.name && <p className="text-[10px] font-semibold text-gray-800 leading-tight">{advisorInfo.name}</p>}
                {advisorInfo.email && <p className="text-[8px] text-gray-500 leading-tight">{advisorInfo.email}</p>}
              </div>
            </div>
          </>
        )}
        {/* Title */}
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <h1 className="text-sm font-bold text-gray-900 tracking-wide font-display uppercase leading-tight">
            Monthly Cashflow Statement
          </h1>
          <p className="text-[9px] text-gray-500 font-display">
            {clientInfo?.projectName || 'Investment Analysis'}
          </p>
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Currency / Language controls */}
        {setCurrency && setLanguage && (
          <DocumentControls
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            exportMode={exportMode}
          />
        )}
      </div>

      {/* ========== HEADER: 3-column grid ========== */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-gray-200">

        {/* Left: Client & Unit Info */}
        <div className="p-2.5 border-r border-gray-200">
          <div className="bg-[#B3893A] px-2 py-1 mb-1.5 rounded-t-sm">
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Client & Unit Information</span>
          </div>
          <table className="w-full">
            <tbody className="text-[10px]">
              {(clientInfo?.developer || clientInfo?.projectName) && (
                <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Property</td><td className="text-gray-900 font-medium">{[clientInfo?.developer, clientInfo?.projectName].filter(Boolean).join(' - ')}</td></tr>
              )}
              {(clientInfo?.clientName || clientInfo?.clientCountry) && (
                <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Client</td><td className="text-gray-900 font-medium">{[clientInfo?.clientName, clientInfo?.clientCountry].filter(Boolean).join(' - ')}</td></tr>
              )}
              <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Unit</td><td className="text-gray-900">{[clientInfo?.unitType || 'N/A', unitSqf > 0 ? `${n2s(unitSqf)} sqft / ${(unitSqf * SQF_TO_M2).toFixed(1)} m²` : null].filter(Boolean).join(' - ')}</td></tr>
              <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Price</td><td className="text-gray-900 font-mono font-semibold">AED {n2s(basePrice)}</td></tr>
              {showCurrencyCol && <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Converted</td><td className="text-gray-900 font-mono">{currency} {cvf(basePrice)}</td></tr>}
              <tr><td className="text-gray-500 font-medium pr-2 py-0.5">Handover</td><td className="text-gray-900">{shortDate(inputs.handoverMonth, inputs.handoverYear)} ({totalMonths}mo)</td></tr>
            </tbody>
          </table>
        </div>

        {/* Center: Snapshot */}
        <div className="p-2.5 border-r border-gray-200 min-w-[280px]">
          <div className="rounded overflow-hidden border border-gray-200">
            <div className="bg-[#B3893A] px-2 py-1">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Snapshot</span>
            </div>
            <div className="p-2">
              <table className="w-full text-[10px]">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5">Payment on SPA</td>
                    <td className="text-right font-mono text-gray-900">{n2s(basePrice * inputs.downpaymentPercent / 100)}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Additional Deposits</td>
                    <td className="text-right font-mono text-gray-900">{n2s(inputs.additionalPayments.reduce((s, p) => s + basePrice * p.paymentPercent / 100, 0))}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Payment on Handover</td>
                    <td className="text-right font-mono text-gray-900">{n2s(paymentRows.find(r => r.isCompletion)?.amount || 0)}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="text-[#8A6528] font-bold py-0.5">Total Equity Required</td>
                    <td className="text-right font-mono text-[#8A6528] font-bold">{n2s(totalEquity)} AED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Projected ROI */}
        <div className="p-2.5">
          <div className="bg-[#B3893A] px-2 py-1 mb-1.5 rounded-t-sm">
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Projected ROI</span>
          </div>
          {exitResults.length > 0 ? (
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-0.5 px-1 text-[8px] font-semibold text-gray-500 uppercase tracking-wide text-left">Exit</th>
                  <th className="py-0.5 px-1 text-[8px] font-semibold text-gray-500 uppercase tracking-wide text-right">ROE</th>
                  <th className="py-0.5 px-1 text-[8px] font-semibold text-gray-500 uppercase tracking-wide text-right">Sale Price</th>
                </tr>
              </thead>
              <tbody>
                {exitResults.map((sc, i) => {
                  const d = getDisplay(sc);
                  const months = scenarioMonths[i];
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-0.5 px-1 text-[#8A6528] font-semibold text-[10px]">
                        {getExitLabel(months)}
                        <span className="text-gray-400 font-normal ml-1">{months}m</span>
                      </td>
                      <td className={`py-0.5 px-1 text-right font-mono font-bold text-[10px] ${d.totalROE >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {pct(d.totalROE)}
                      </td>
                      <td className="py-0.5 px-1 text-right font-mono text-gray-900 text-[10px]">AED {n2s(sc.exitPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-[10px] text-gray-400 italic">No exit scenarios configured</p>
          )}
        </div>
      </div>

      {/* ========== SECTION A: Initial Cost ========== */}
      {sectionBar('A', 'Initial Cost')}
      <div className="border-b border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className={th + " text-left"}>Item</th>
              <th className={th + " text-left"}>Detail</th>
              <th className={th + " text-right"}>AED</th>
              {showCurrencyCol && <th className={th + " text-right"}>{currency}</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className={tc + " text-gray-900 font-medium"}>A1. Holding Fee</td>
              <td className={tc + " text-gray-500"}>EOI / Booking Deposit</td>
              <td className={tc + " text-right font-mono text-gray-900"}>{n2s(inputs.eoiFee)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(inputs.eoiFee)}</td>}
            </tr>
            <tr className="border-t border-gray-100">
              <td className={tc + " text-gray-900 font-medium"}>A2. SPA Payment</td>
              <td className={tc + " text-gray-500"}>{inputs.downpaymentPercent}% of Price</td>
              <td className={tc + " text-right font-mono text-gray-900"}>{n2s(basePrice * inputs.downpaymentPercent / 100)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(basePrice * inputs.downpaymentPercent / 100)}</td>}
            </tr>
            <tr className="border-t border-gray-100">
              <td className={tc + " text-gray-900 font-medium"}>A3. DLD Fee</td>
              <td className={tc + " text-gray-500"}>4% of Price</td>
              <td className={tc + " text-right font-mono text-gray-900"}>{n2s(dldFee)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(dldFee)}</td>}
            </tr>
            <tr className="border-t border-gray-100">
              <td className={tc + " text-gray-900 font-medium"}>A4. Oqood Fee</td>
              <td className={tc + " text-gray-500"}>Admin Fee</td>
              <td className={tc + " text-right font-mono text-gray-900"}>{n2s(inputs.oqoodFee)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(inputs.oqoodFee)}</td>}
            </tr>
            <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
              <td className={tc + " font-bold text-[#8A6528]"} colSpan={2}>Cash to Start</td>
              <td className={tc + " text-right font-bold font-mono text-[#8A6528]"}>{n2s(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-bold font-mono text-[#8A6528]"}>{cvf(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}</td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ========== SECTION B: Milestone Event ========== */}
      {sectionBar('B', 'Milestone Event')}
      <div className="border-b border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className={th + " text-left"}>Milestone</th>
              <th className={th + " text-left"}>When</th>
              <th className={th + " text-right"}>%</th>
              <th className={th + " text-right"}>AED</th>
              {showCurrencyCol && <th className={th + " text-right"}>{currency}</th>}
            </tr>
          </thead>
          <tbody>
            {paymentRows.map((row, i) => (
              <tr key={i} className={`border-t border-gray-100 ${row.isCompletion ? 'bg-[#B3893A]/5' : ''}`}>
                <td className={tc + (row.isCompletion ? ' text-[#8A6528] font-semibold' : ' text-gray-900 font-medium')}>
                  {row.label}
                  {row.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`ml-1 inline-flex items-center text-[7px] px-1 rounded font-bold uppercase leading-none ${
                        badge === 'Resale'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </td>
                <td className={tc + " text-gray-700"}>{row.date}</td>
                <td className={tc + " text-right text-gray-500 font-mono"}>{row.percent}%</td>
                <td className={tc + " text-right font-mono text-gray-900"}>{n2s(row.amount)}</td>
                {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(row.amount)}</td>}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
              <td className={tc + " font-bold text-[#8A6528]"} colSpan={3}>Total Equity Required</td>
              <td className={tc + " text-right font-bold font-mono text-[#8A6528]"}>{n2s(totalEquity)}</td>
              {showCurrencyCol && <td className={tc + " text-right font-bold font-mono text-[#8A6528]"}>{cvf(totalEquity)}</td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ========== SECTION C + D: Rental + Annual Cash Position (side by side) ========== */}
      <div className="grid grid-cols-[1fr_2fr] gap-0">

        {/* Section C: Rental Income — monthly AND yearly */}
        <div>
          {sectionBar('C', 'Projected Rental Income')}
          <div className="border-r border-b border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className={th + " text-left"}></th>
                  <th className={th + " text-right"}>Monthly</th>
                  <th className={th + " text-right"}>Annual</th>
                  {showCurrencyCol && <th className={th + " text-right"}>Monthly {currency}</th>}
                  {showCurrencyCol && <th className={th + " text-right"}>Annual {currency}</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-gray-500"}>Gross Rental</td>
                  <td className={tc + " text-right font-mono text-gray-900"}>{n2s(grossMonthlyRent)}</td>
                  <td className={tc + " text-right font-mono text-gray-900"}>{n2s(grossAnnualRent)}</td>
                  {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(grossMonthlyRent)}</td>}
                  {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{cvf(grossAnnualRent)}</td>}
                </tr>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-red-600"}>- Service Charges</td>
                  <td className={tc + " text-right font-mono text-red-600"}>{n2s(monthlyServiceCharge)}</td>
                  <td className={tc + " text-right font-mono text-red-600"}>{n2s(annualServiceCharge)}</td>
                  {showCurrencyCol && <td className={tc + " text-right font-mono text-red-600/70"}>{cvf(monthlyServiceCharge)}</td>}
                  {showCurrencyCol && <td className={tc + " text-right font-mono text-red-600/70"}>{cvf(annualServiceCharge)}</td>}
                </tr>
                <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                  <td className={tc + " font-bold text-gray-900"}>Net Income</td>
                  <td className={tc + " text-right font-bold text-emerald-600 font-mono"}>{n2s(netMonthlyIncome)}</td>
                  <td className={tc + " text-right font-bold text-emerald-600 font-mono"}>{n2s(netAnnualIncome)}</td>
                  {showCurrencyCol && <td className={tc + " text-right font-bold text-emerald-600 font-mono"}>{cvf(netMonthlyIncome)}</td>}
                  {showCurrencyCol && <td className={tc + " text-right font-bold text-emerald-600 font-mono"}>{cvf(netAnnualIncome)}</td>}
                </tr>
                <tr className="border-t border-gray-100 bg-emerald-50/50">
                  <td className={tc + " text-emerald-700 font-semibold"}>Gross Yield</td>
                  <td className={tc + " text-right text-emerald-700 font-bold font-mono"} colSpan={showCurrencyCol ? 4 : 2}>{pct(grossYield)}</td>
                </tr>
                <tr className="border-t border-gray-100 bg-emerald-50/50">
                  <td className={tc + " text-emerald-700 font-semibold"}>Net Yield</td>
                  <td className={tc + " text-right text-emerald-700 font-bold font-mono"} colSpan={showCurrencyCol ? 4 : 2}>{pct(netYield)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section D: Annual Net Cash Position */}
        <div>
          {sectionBar('D', 'Annual Net Cash Position')}
          <div className="border-b border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className={th}></th>
                  {rentalYears.slice(0, 10).map((yr) => (
                    <th key={yr.year} className={th + " text-center"}>{yr.calendarYear}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-gray-500"}>Net Rent</td>
                  {rentalYears.slice(0, 10).map((yr) => (
                    <td key={yr.year} className={tc + " text-center text-emerald-600 font-mono"}>
                      {yr.netRent != null ? n2s(yr.netRent) : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-gray-500"}>Prop. Value</td>
                  {rentalYears.slice(0, 10).map((yr) => (
                    <td key={yr.year} className={tc + " text-center text-gray-700 font-mono"}>
                      {n2s(yr.propertyValue)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== SECTION E: Exit Scenarios ========== */}
      {exitResults.length > 0 && (
        <>
          {sectionBar('E', 'Exit Scenarios')}
          <div className="border-b border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className={th + " text-left"}>Exit</th>
                  <th className={th + " text-right"}>Timeline</th>
                  <th className={th + " text-right"}>Sale Price</th>
                  <th className={th + " text-right"}>Appreciation</th>
                  <th className={th + " text-right"}>Invested</th>
                  <th className={th + " text-right"}>Profit</th>
                  <th className={th + " text-right"}>ROE</th>
                </tr>
              </thead>
              <tbody>
                {exitResults.map((sc, i) => {
                  const d = getDisplay(sc);
                  const months = scenarioMonths[i];
                  return (
                    <tr key={i} className={`border-t border-gray-100 ${isHandoverExit(months, totalMonths) ? 'bg-[#B3893A]/5' : ''}`}>
                      <td className={tc + " text-[#8A6528] font-semibold"}>
                        {getExitLabel(months)}
                      </td>
                      <td className={tc + " text-right text-gray-500 font-mono"}>{months}mo</td>
                      <td className={tc + " text-right font-mono text-gray-900"}>{n2s(sc.exitPrice)}</td>
                      <td className={tc + " text-right font-mono " + (sc.appreciationPercent >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {pct(sc.appreciationPercent)}
                      </td>
                      <td className={tc + " text-right font-mono text-gray-700"}>{n2s(sc.totalCapital)}</td>
                      <td className={tc + " text-right font-mono font-bold " + (d.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {d.profit >= 0 ? '+' : ''}{n2s(d.profit)}
                      </td>
                      <td className={tc + " text-right"}>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${d.totalROE >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {pct(d.totalROE)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========== SECTION F: Financing (if enabled) ========== */}
      {mortgageData?.enabled && (
        <>
          {sectionBar('F', 'Financing')}
          <div className="border-b border-gray-200">
            <table className="w-full">
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-gray-500"}>Loan Amount ({mortgageData.financingPercent}%)</td>
                  <td className={tc + " text-right font-mono text-gray-900"}>AED {n2s(mortgageData.loanAmount)}</td>
                  {showCurrencyCol && <td className={tc + " text-right font-mono text-gray-500"}>{currency} {cvf(mortgageData.loanAmount)}</td>}
                </tr>
                <tr className="border-t border-gray-100">
                  <td className={tc + " text-gray-500"}>Interest Rate</td>
                  <td className={tc + " text-right font-mono text-gray-900"} colSpan={showCurrencyCol ? 2 : 1}>{mortgageData.interestRate}% / {mortgageData.loanTermYears}yr</td>
                </tr>
                <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                  <td className={tc + " font-bold text-gray-900"}>Monthly Payment</td>
                  <td className={tc + " text-right font-bold text-red-600 font-mono"}>AED {n2s(mortgageData.monthlyPayment)}</td>
                  {showCurrencyCol && <td className={tc + " text-right font-bold text-red-600 font-mono"}>{currency} {cvf(mortgageData.monthlyPayment)}</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

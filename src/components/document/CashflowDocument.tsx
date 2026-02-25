import React, { useMemo, useState } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { calculateExitScenario, ExitScenarioResult, isHandoverExit } from '@/components/roi/constructionProgress';
import { NoteCell } from './NoteCell';
import { DocumentControls, Currency } from './DocumentControls';
import { PropertyGrowthChart } from './PropertyGrowthChart';
import { Info } from 'lucide-react';

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

interface CashflowDocumentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo?: ClientUnitData;
  exitScenarios?: number[];
  currency?: Currency;
  rate?: number;
  language?: string;
  exportMode?: boolean;
  notes?: Record<string, string>;
  onNotesChange?: (notes: Record<string, string>) => void;
  setCurrency?: (c: Currency) => void;
  setLanguage?: (l: string) => void;
  mortgageData?: MortgageData;
  brokerLogoUrl?: string;
  advisorInfo?: { name?: string; email?: string; photoUrl?: string; phone?: string };
}

// Number formatting
const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);
const n2sShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};

export const CashflowDocument: React.FC<CashflowDocumentProps> = ({
  inputs,
  calculations,
  clientInfo,
  exitScenarios: exitScenarioMonths,
  currency = 'AED',
  rate = 1,
  language = 'en',
  exportMode = false,
  notes = {},
  onNotesChange,
  setCurrency,
  setLanguage,
  mortgageData,
  brokerLogoUrl,
  advisorInfo,
}) => {
  const [exitDetailModal, setExitDetailModal] = useState<number | null>(null);

  const { basePrice, totalMonths, yearlyProjections, holdAnalysis, totalEntryCosts } = calculations;
  const dldFee = basePrice * 0.04;
  const showCurrencyCol = currency !== 'AED';

  // Currency conversion helper
  const cv = (aed: number) => currency === 'AED' ? aed : aed * rate;
  const cvf = (aed: number) => n2s(cv(aed));

  // Exit scenarios
  const scenarioMonths = exitScenarioMonths || inputs._exitScenarios || [];
  const exitResults = useMemo(() => {
    return scenarioMonths.map((m) =>
      calculateExitScenario(m, basePrice, totalMonths, inputs, totalEntryCosts)
    );
  }, [scenarioMonths, basePrice, totalMonths, inputs, totalEntryCosts]);

  // Consistent exit display
  const getDisplay = (sc: ExitScenarioResult) => ({
    profit: sc.exitCosts > 0 ? sc.netProfit : sc.trueProfit,
    totalROE: sc.exitCosts > 0 ? sc.netROE : sc.trueROE,
  });

  // Semantic exit label
  const getExitLabel = (months: number) => {
    if (isHandoverExit(months, totalMonths)) return 'Handover';
    if (months === totalMonths - 1) return 'Pre-Handover';
    if (months < totalMonths) return `${months} mo`;
    const yearsAfter = Math.round((months - totalMonths) / 12);
    if (yearsAfter > 0) return `Yr ${yearsAfter} Hold`;
    return `+${months - totalMonths}m`;
  };

  // Payment plan rows for Section B
  const resellThreshold = (inputs as any).resellEligiblePercent ?? 30;
  const mortgageThreshold = (inputs as any).mortgageEligiblePercent ?? 50;

  // Helper to compute payment date from milestone
  const getPaymentDate = (m: { type: string; triggerValue: number }, bookingMonth: number, bookingYear: number, handoverMonth: number, handoverYear: number) => {
    const bookDate = new Date(bookingYear, bookingMonth - 1);
    const hoDate = new Date(handoverYear, handoverMonth - 1);

    if (m.type === 'time') {
      const d = new Date(bookDate);
      d.setMonth(d.getMonth() + m.triggerValue);
      return { date: d, detail: `Month ${m.triggerValue}` };
    }
    if (m.type === 'construction') {
      // Estimate date based on construction progress %
      const totalMs = hoDate.getTime() - bookDate.getTime();
      const d = new Date(bookDate.getTime() + totalMs * (m.triggerValue / 100));
      return { date: d, detail: `${m.triggerValue}% complete` };
    }
    if (m.type === 'post-handover') {
      const d = new Date(hoDate);
      d.setMonth(d.getMonth() + m.triggerValue);
      return { date: d, detail: `HO +${m.triggerValue}mo` };
    }
    return null;
  };

  const formatShortDate = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const paymentRows = useMemo(() => {
    const rows: {
      label: string;
      percent: number;
      amount: number;
      cumulative: number;
      isHandover?: boolean;
      badges: string[];
      dateStr?: string;
      dateDetail?: string;
    }[] = [];
    let cum = 0;
    let resellShown = false;
    let mortgageShown = false;

    // Booking date
    const bookDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);

    // Downpayment
    cum += inputs.downpaymentPercent;
    const dpBadges: string[] = [];
    if (!resellShown && cum >= resellThreshold) { dpBadges.push('Resale'); resellShown = true; }
    if (!mortgageShown && cum >= mortgageThreshold) { dpBadges.push('Mortgage'); mortgageShown = true; }
    rows.push({
      label: 'Downpayment (Booking)',
      percent: inputs.downpaymentPercent,
      amount: basePrice * inputs.downpaymentPercent / 100,
      cumulative: cum,
      badges: dpBadges,
      dateStr: formatShortDate(bookDate),
      dateDetail: 'Booking',
    });

    // Additional payments
    inputs.additionalPayments.forEach((m, i) => {
      if (m.paymentPercent <= 0) return;
      cum += m.paymentPercent;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push('Resale'); resellShown = true; }
      if (!mortgageShown && cum >= mortgageThreshold) { badges.push('Mortgage'); mortgageShown = true; }

      const dateInfo = getPaymentDate(m, inputs.bookingMonth, inputs.bookingYear, inputs.handoverMonth, inputs.handoverYear);
      rows.push({
        label: m.label || `${i + 1}${ordSuffix(i + 1)} Installment`,
        percent: m.paymentPercent,
        amount: basePrice * m.paymentPercent / 100,
        cumulative: cum,
        badges,
        dateStr: dateInfo ? formatShortDate(dateInfo.date) : undefined,
        dateDetail: dateInfo?.detail,
      });
    });

    // Handover balance
    const handoverPercent = 100 - cum;
    if (handoverPercent > 0.5) {
      cum += handoverPercent;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push('Resale'); resellShown = true; }
      if (!mortgageShown && cum >= mortgageThreshold) { badges.push('Mortgage'); mortgageShown = true; }
      const hoDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
      rows.push({
        label: 'Completion Payment',
        percent: Math.round(handoverPercent * 10) / 10,
        amount: basePrice * handoverPercent / 100,
        cumulative: cum,
        isHandover: true,
        badges,
        dateStr: formatShortDate(hoDate),
        dateDetail: 'Handover',
      });
    }

    return rows;
  }, [inputs, basePrice, resellThreshold, mortgageThreshold]);

  // Rental calculations
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (inputs.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const grossYield = inputs.rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // Snapshot calculations
  const additionalDeposits = paymentRows
    .filter(r => !r.isHandover && r.label !== 'Downpayment (Booking)')
    .reduce((sum, r) => sum + r.amount, 0);
  const handoverPayment = paymentRows.find(r => r.isHandover)?.amount || 0;

  // Mortgage
  const netMonthlyRent = netAnnualRent / 12;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden text-[11px] text-gray-900">
      {/* ============ CONTROLS (not printed) ============ */}
      {setCurrency && setLanguage && (
        <div className="flex justify-end p-3 border-b border-gray-100 bg-gray-50 print:hidden">
          <DocumentControls
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            exportMode={exportMode}
          />
        </div>
      )}

      {/* ============ LOGO + ADVISOR HEADER ============ */}
      <div className="px-5 pt-4 flex items-center gap-4">
        <div className={!brokerLogoUrl ? 'print:hidden' : ''}>
          {brokerLogoUrl ? (
            <img
              src={brokerLogoUrl}
              alt="Company logo"
              className="h-[50px] w-auto max-w-[150px] object-contain"
            />
          ) : (
            <a
              href="/account"
              className="h-[50px] w-[150px] border-2 border-dashed border-theme-border rounded-md flex items-center justify-center hover:border-theme-accent/40 hover:bg-theme-accent/5 transition-colors cursor-pointer"
              data-export-hide
              title="Upload your logo in Account Settings"
            >
              <span className="text-[10px] text-theme-text-muted">+ Add Company Logo</span>
            </a>
          )}
        </div>
        {advisorInfo && (advisorInfo.name || advisorInfo.email) && (
          <>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              {advisorInfo.photoUrl ? (
                <img src={advisorInfo.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
              ) : advisorInfo.name ? (
                <div className="w-9 h-9 rounded-full bg-[#B3893A]/15 border border-[#B3893A]/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#B3893A]">
                    {advisorInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
              ) : null}
              <div>
                {advisorInfo.name && <p className="text-[11px] font-semibold text-gray-800 leading-tight">{advisorInfo.name}</p>}
                {advisorInfo.email && <p className="text-[9px] text-gray-500 leading-tight">{advisorInfo.email}</p>}
                {advisorInfo.phone && <p className="text-[9px] text-gray-500 leading-tight">{advisorInfo.phone}</p>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============ HEADER — 3-column grid ============ */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 border-b border-gray-200">
        {/* Col 1: Client & Unit Info */}
        <div className="p-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Client and Unit Information</span>
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-3">
            <table className="w-full text-[10.5px]">
              <tbody>
                {[
                  { label: 'Developer', value: clientInfo?.developer },
                  { label: 'Client Name', value: clientInfo?.clientName },
                  { label: 'Client Country', value: clientInfo?.clientCountry },
                  { label: 'Unit', value: (inputs as any)._clientInfo?.unit },
                  { label: 'Size (sqft)', value: inputs.unitSizeSqf ? n2s(inputs.unitSizeSqf) : undefined },
                  { label: 'Type', value: clientInfo?.unitType },
                  { label: 'Purchase Price', value: `AED ${n2s(basePrice)}` },
                  ...(showCurrencyCol ? [{ label: 'Converted', value: `${currency} ${cvf(basePrice)}` }] : []),
                ].map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-[3px] pr-4 text-gray-500 font-medium whitespace-nowrap">{row.label}</td>
                    <td className="py-[3px] text-gray-900 font-medium">{row.value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 2: Title + Snapshot */}
        <div className="p-5 border-x border-gray-100 flex flex-col items-center">
          <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight mb-1 uppercase tracking-wide text-center">
            Monthly Cashflow Statement
          </h1>
          <p className="font-display text-lg text-gray-500 mb-5 text-center">
            {clientInfo?.projectName || 'Investment Strategy'}
          </p>

          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Snapshot</span>
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-md p-3">
              <table className="w-full text-[10.5px]">
                <tbody>
                  <tr>
                    <td className="py-[3px] text-gray-500">Payment on SPA</td>
                    <td className="py-[3px] text-right font-mono font-medium text-gray-900">{n2s(basePrice * inputs.downpaymentPercent / 100)} AED</td>
                  </tr>
                  <tr>
                    <td className="py-[3px] text-gray-500">Additional Deposits</td>
                    <td className="py-[3px] text-right font-mono font-medium text-gray-900">{n2s(additionalDeposits)} AED</td>
                  </tr>
                  <tr>
                    <td className="py-[3px] text-gray-500">Payment on Handover</td>
                    <td className="py-[3px] text-right font-mono font-medium text-gray-900">{n2s(handoverPayment)} AED</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-[3px] font-bold text-gray-900">Total Equity Required</td>
                    <td className="py-[3px] text-right font-mono font-bold text-gray-900">{n2s(basePrice)} AED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Col 3: Projected ROI */}
        <div className="p-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Projected ROI</span>
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md overflow-hidden">
            {exitResults.length === 0 && (
              <div className="p-4 text-center text-[10px] text-gray-400">
                No exits configured
              </div>
            )}
            {exitResults.length > 0 && (
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-left">Exit</th>
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-right">ROE</th>
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-right">Sale Price</th>
                  </tr>
                </thead>
                <tbody>
                  {exitResults.slice(0, 3).map((sc, i) => {
                    const d = getDisplay(sc);
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-1.5 px-3 text-gray-700 font-medium">{getExitLabel(scenarioMonths[i])}</td>
                        <td className="py-1.5 px-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                            {d.totalROE.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-gray-900">AED {n2s(sc.exitPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ============ SECTIONS — generous spacing ============ */}
      <div className="space-y-6 py-6">

        {/* ============ SECTION A: Initial Cost ============ */}
        <div>
          <SectionHeader letter="A" title="Initial Cost" />
          <div className="px-5">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className={TH_CLS + ' text-left w-12'}>#</th>
                    <th className={TH_CLS + ' text-left'}>Description</th>
                    <th className={TH_CLS + ' text-right'}>AED</th>
                    {showCurrencyCol && <th className={TH_CLS + ' text-right'}>{currency}</th>}
                    <th className={TH_CLS + ' text-left w-28'}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { num: 'A1', label: 'Holding Fee', desc: 'Holding', value: inputs.eoiFee, key: 'a-eoi' },
                    { num: 'A2', label: 'Signed Purchase Agreement', desc: `${inputs.downpaymentPercent}% of Price`, value: basePrice * inputs.downpaymentPercent / 100, key: 'a-spa' },
                    { num: 'A3', label: 'Dubai Land Dept Fee', desc: '4% of Price', value: dldFee, key: 'a-dld' },
                    { num: 'A4', label: 'Oqood Fee', desc: 'Admin', value: inputs.oqoodFee, key: 'a-oqood' },
                  ].map((row) => (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className={TD_CLS + ' text-gray-400 font-mono'}>{row.num}</td>
                      <td className={TD_CLS}>
                        <span className="text-gray-900 font-medium">{row.label}</span>
                        <span className="text-gray-400 ml-2 text-[10px]">{row.desc}</span>
                      </td>
                      <td className={TD_CLS + ' text-right font-mono text-gray-900'}>{n2s(row.value)}</td>
                      {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-gray-900'}>{cvf(row.value)}</td>}
                      <td className={TD_CLS}>
                        <NoteCell noteKey={row.key} notes={notes} onNotesChange={onNotesChange} exportMode={exportMode} />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                    <td className={TD_CLS} />
                    <td className={TD_CLS + ' font-bold text-gray-900'}>Cash to Start</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-gray-900'}>
                      {n2s(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}
                    </td>
                    {showCurrencyCol && (
                      <td className={TD_CLS + ' text-right font-mono font-bold text-gray-900'}>
                        {cvf(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}
                      </td>
                    )}
                    <td className={TD_CLS} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ SECTION B: Milestone Event ============ */}
        <div>
          <SectionHeader letter="B" title="Milestone Event" />
          <div className="px-5">
            {(() => {
              const colCount = paymentRows.length <= 12 ? 1 : paymentRows.length <= 24 ? 2 : 3;
              const isMultiCol = colCount > 1;
              const thCls = isMultiCol ? 'py-1.5 px-2 text-[8px] font-semibold text-white uppercase tracking-wide' : TH_CLS;
              const tdCls = isMultiCol ? 'py-1 px-2 text-[10px]' : TD_CLS;

              // Split rows into columns
              const columns: typeof paymentRows[] = [];
              if (isMultiCol) {
                const perCol = Math.ceil(paymentRows.length / colCount);
                for (let c = 0; c < colCount; c++) {
                  columns.push(paymentRows.slice(c * perCol, (c + 1) * perCol));
                }
              }

              const renderTable = (rows: typeof paymentRows, startIdx: number, compact: boolean) => (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className={thCls + ' text-left'}>Description</th>
                      <th className={thCls + ' text-left w-16'}>When</th>
                      <th className={thCls + ' text-right w-10'}>%</th>
                      <th className={thCls + ' text-right'}>AED</th>
                      {showCurrencyCol && !compact && <th className={thCls + ' text-right'}>{currency}</th>}
                      {!compact && <th className={thCls + ' text-left w-24'}>Notes</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={startIdx + i}
                        className={`border-t border-gray-100 ${row.isHandover ? 'bg-[#B3893A]/5' : ''}`}
                      >
                        <td className={tdCls}>
                          <span className={`font-medium ${row.isHandover ? 'text-[#8A6528]' : 'text-gray-900'}`}>
                            {row.label}
                          </span>
                          {row.badges.map((badge) => (
                            <span
                              key={badge}
                              className={`ml-1 inline-flex text-[7px] px-1 py-0.5 rounded font-bold uppercase ${
                                badge === 'Resale'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {badge}
                            </span>
                          ))}
                        </td>
                        <td className={tdCls}>
                          {row.dateStr && (
                            <div>
                              <span className="text-gray-800 font-medium">{row.dateStr}</span>
                              {row.dateDetail && !compact && (
                                <span className="block text-[8px] text-gray-400">{row.dateDetail}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className={tdCls + ' text-right font-mono text-gray-600'}>{row.percent}%</td>
                        <td className={tdCls + ' text-right font-mono text-gray-900'}>{n2s(row.amount)}</td>
                        {showCurrencyCol && !compact && <td className={tdCls + ' text-right font-mono text-gray-900'}>{cvf(row.amount)}</td>}
                        {!compact && (
                          <td className={tdCls}>
                            <NoteCell noteKey={`b-milestone-${startIdx + i}`} notes={notes} onNotesChange={onNotesChange} exportMode={exportMode} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );

              return (
                <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                  {isMultiCol ? (
                    <div className={`grid ${colCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {columns.map((colRows, colIdx) => (
                        <div key={colIdx} className={colIdx > 0 ? 'border-l border-gray-200' : ''}>
                          {renderTable(
                            colRows,
                            colIdx * Math.ceil(paymentRows.length / colCount),
                            true,
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    renderTable(paymentRows, 0, false)
                  )}
                  {/* Total row — always full width */}
                  <table className="w-full">
                    <tbody>
                      <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                        <td className={TD_CLS + ' font-bold text-[#8A6528]'}>Total Equity Required</td>
                        <td className={TD_CLS} />
                        <td className={TD_CLS + ' text-right font-mono font-bold text-[#8A6528]'}>100%</td>
                        <td className={TD_CLS + ' text-right font-mono font-bold text-[#8A6528]'}>{n2s(basePrice)}</td>
                        {showCurrencyCol && (
                          <td className={TD_CLS + ' text-right font-mono font-bold text-[#8A6528]'}>{cvf(basePrice)}</td>
                        )}
                        <td className={TD_CLS} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ============ SECTION C: Projected Rental Income ============ */}
        <div>
          <SectionHeader letter="C" title="Projected Rental Income" />
          <div className="px-5">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className={TH_CLS + ' text-left'}>Label</th>
                    <th className={TH_CLS + ' text-right'}>Monthly AED</th>
                    <th className={TH_CLS + ' text-right'}>Annual AED</th>
                    {showCurrencyCol && <th className={TH_CLS + ' text-right'}>Monthly {currency}</th>}
                    {showCurrencyCol && <th className={TH_CLS + ' text-right'}>Annual {currency}</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' text-gray-900 font-medium'}>Gross Rental Income</td>
                    <td className={TD_CLS + ' text-right font-mono'}>{n2s(grossAnnualRent / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono'}>{n2s(grossAnnualRent)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono'}>{cvf(grossAnnualRent / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono'}>{cvf(grossAnnualRent)}</td>}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS}>
                      <span className="text-red-600 font-medium">- Service Charges</span>
                    </td>
                    <td className={TD_CLS + ' text-right font-mono text-red-600'}>{n2s(annualServiceCharges / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono text-red-600'}>{n2s(annualServiceCharges)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-red-600'}>{cvf(annualServiceCharges / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-red-600'}>{cvf(annualServiceCharges)}</td>}
                  </tr>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>Net Rental Income</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{n2s(netAnnualRent / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{n2s(netAnnualRent)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{cvf(netAnnualRent / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{cvf(netAnnualRent)}</td>}
                  </tr>
                  {/* Yield rows */}
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>Gross Yield</td>
                    <td colSpan={showCurrencyCol ? 4 : 2} className={TD_CLS + ' text-right'}>
                      <span className="inline-flex items-center px-3 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                        {grossYield.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>Net Yield</td>
                    <td colSpan={showCurrencyCol ? 4 : 2} className={TD_CLS + ' text-right'}>
                      <span className="inline-flex items-center px-3 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                        {netYield.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ SECTION D: Annual Net Cash Position ============ */}
        <div>
          <SectionHeader letter="D" title="Annual Net Cash Position" />
          <div className="px-5">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((yr) => (
                      <th key={yr} className={TH_CLS + ' text-center text-[9px]'}>Yr {yr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                      const proj = yearlyProjections[i];
                      const value = proj?.netIncome ?? 0;
                      return (
                        <td
                          key={i}
                          className={`${TD_CLS} text-center font-mono font-medium text-[10px] ${
                            value > 0 ? 'text-emerald-600 bg-emerald-50/50' : value < 0 ? 'text-red-600 bg-red-50/50' : 'text-gray-400'
                          }`}
                        >
                          {value !== 0 ? n2sShort(value) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Property Growth Chart */}
            <PropertyGrowthChart
              yearlyProjections={yearlyProjections}
              basePrice={basePrice}
              exitResults={exitResults}
              scenarioMonths={scenarioMonths}
              totalMonths={totalMonths}
            />
          </div>
        </div>

        {/* ============ SECTION E: Exit Scenarios ============ */}
        {exitResults.length > 0 && (() => {
          const hasThresholdWarning = exitResults.some(sc => !sc.isThresholdMet);
          return (
            <div>
              <SectionHeader letter="E" title="Exit Scenarios" />
              <div className="px-5">
                <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-900">
                        <th className={TH_CLS + ' text-left'}>Exit</th>
                        <th className={TH_CLS + ' text-right'}>Invested</th>
                        <th className={TH_CLS + ' text-right'}>Exit Price</th>
                        <th className={TH_CLS + ' text-right'}>Net Profit</th>
                        <th className={TH_CLS + ' text-right'}>ROE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exitResults.map((sc, i) => {
                        const d = getDisplay(sc);
                        const months = scenarioMonths[i];
                        const isHO = isHandoverExit(months, totalMonths);
                        return (
                          <tr
                            key={i}
                            className={`border-t border-gray-100 ${isHO ? 'bg-[#B3893A]/5' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                            onClick={() => !exportMode && setExitDetailModal(i)}
                          >
                            <td className={`${TD_CLS} font-medium ${isHO ? 'text-[#8A6528]' : 'text-gray-900'}`}>
                              {getExitLabel(months)}
                              <span className="text-[9px] ml-1 text-gray-400 font-mono">{months}m</span>
                              {!sc.isThresholdMet && (
                                <span className="ml-1.5 inline-flex text-[8px] px-1 py-0.5 rounded bg-[#B3893A]/15 text-[#8A6528] font-bold" title="Below developer threshold">
                                  ⚠
                                </span>
                              )}
                            </td>
                            <td className={TD_CLS + ' text-right font-mono text-gray-700'}>
                              {n2s(sc.totalCapital)}{!sc.isThresholdMet && '*'}
                            </td>
                            <td className={TD_CLS + ' text-right font-mono font-medium text-gray-900'}>AED {n2s(sc.exitPrice)}</td>
                            <td className={`${TD_CLS} text-right font-mono font-semibold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {d.profit >= 0 ? '+' : ''}{n2s(Math.abs(d.profit))}
                            </td>
                            <td className={TD_CLS + ' text-right'}>
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                                {d.totalROE.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Threshold footnote */}
                  {hasThresholdWarning && (
                    <div className="px-4 py-2 bg-[#B3893A]/5 border-t border-[#B3893A]/20 text-[10px] text-[#8A6528]">
                      <span className="font-semibold">* Below {inputs.minimumExitThreshold}% threshold</span>
                      {' — '}advance required to meet developer minimum before resale. Invested amount includes the additional payment needed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============ SECTION F: Financing (conditional) ============ */}
        {mortgageData?.enabled && (
          <div>
            <SectionHeader
              letter="F"
              title="Financing"
              subtitle={`${mortgageData.financingPercent}% + ${mortgageData.loanTermYears}yr + ${mortgageData.interestRate}%`}
            />
            <div className="px-5">
              <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {[
                      { label: 'Loan Amount', value: `AED ${n2s(mortgageData.loanAmount)}`, cls: '' },
                      { label: 'Monthly Payment (+ Insurance)', value: `AED ${n2s(mortgageData.monthlyPayment)}`, cls: '' },
                      { label: 'Net Monthly Rent', value: `AED ${n2s(netMonthlyRent)}`, cls: '' },
                      {
                        label: 'Monthly Cashflow',
                        value: `${netMonthlyRent - mortgageData.monthlyPayment >= 0 ? '+' : ''} AED ${n2s(netMonthlyRent - mortgageData.monthlyPayment)}`,
                        cls: netMonthlyRent - mortgageData.monthlyPayment >= 0 ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-red-600 bg-red-50/50 font-bold',
                      },
                      {
                        label: 'Rent Coverage',
                        value: `${mortgageData.monthlyPayment > 0 ? Math.round((netMonthlyRent / mortgageData.monthlyPayment) * 100) : 0}%`,
                        cls: netMonthlyRent >= mortgageData.monthlyPayment ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-red-600 bg-red-50/50 font-bold',
                      },
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-gray-100 first:border-t-0">
                        <td className={TD_CLS + ' text-gray-700 font-medium'}>{row.label}</td>
                        <td className={`${TD_CLS} text-right font-mono ${row.cls || 'text-gray-900'}`}>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ SECTION G: Floor Plan (conditional) ============ */}
        {(inputs as any)._floorplanUrl && (
          <div>
            <SectionHeader letter="G" title="Floor Plan" subtitle="Unit Layout" />
            <div className="px-5">
              <img
                src={(inputs as any)._floorplanUrl}
                alt="Floor Plan"
                className="w-full max-h-[500px] object-contain rounded-lg border border-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-4" />

      {/* ============ EXIT DETAIL MODAL ============ */}
      {exitDetailModal !== null && exitResults[exitDetailModal] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setExitDetailModal(null)}>
          <div
            className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 bg-[#B3893A]">
              <h3 className="font-display text-sm font-bold text-white">
                Exit at {scenarioMonths[exitDetailModal]}m — Full Analysis
              </h3>
              <button onClick={() => setExitDetailModal(null)} className="text-white/70 hover:text-white text-lg font-bold">&times;</button>
            </div>
            <div className="p-5 space-y-1.5 text-xs max-h-[60vh] overflow-y-auto">
              {(() => {
                const sc = exitResults[exitDetailModal];
                const d = getDisplay(sc);
                const rows = [
                  { label: 'Exit Price', value: `${currency} ${cvf(sc.exitPrice)}` },
                  { label: 'Appreciation', value: `${currency} ${cvf(sc.appreciation)} (${sc.appreciationPercent.toFixed(1)}%)` },
                  { label: 'Equity Deployed', value: `${currency} ${cvf(sc.equityDeployed)} (${sc.equityPercent.toFixed(0)}%)` },
                  { label: 'Entry Costs (DLD + Oqood)', value: `${currency} ${cvf(sc.entryCosts)}` },
                  ...(sc.exitCosts > 0 ? [
                    { label: 'Agent Commission', value: `${currency} ${cvf(sc.agentCommission)}` },
                    { label: 'NOC Fee', value: `${currency} ${cvf(sc.nocFee)}` },
                  ] : []),
                  { label: 'Total Capital', value: `${currency} ${cvf(sc.totalCapital)}`, accent: true },
                  { label: 'Net Profit', value: `${d.profit >= 0 ? '+' : ''}${currency} ${cvf(d.profit)}`, positive: d.profit >= 0, negative: d.profit < 0 },
                  { label: 'Total ROE', value: `${d.totalROE.toFixed(1)}%`, accent: true },
                ];
                return rows.map((r, j) => (
                  <div key={j} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{r.label}</span>
                    <span className={`font-mono font-semibold ${
                      r.positive ? 'text-emerald-600' : r.negative ? 'text-red-600' : r.accent ? 'text-[#B3893A]' : 'text-gray-900'
                    }`}>{r.value}</span>
                  </div>
                ));
              })()}
              {!exitResults[exitDetailModal].isThresholdMet && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold mb-1">
                    <Info className="w-3.5 h-3.5" />
                    Advance Required
                  </div>
                  <p className="text-[10px] text-gray-600">
                    Payment plan hasn't reached the {inputs.minimumExitThreshold}% threshold.
                    Advance of {currency} {cvf(exitResults[exitDetailModal].advanceRequired)} needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Ordinal suffix helper
function ordSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Shared constants ───────────────────────────────────────────────
const TH_CLS = 'py-2 px-4 text-[9px] font-semibold text-white uppercase tracking-wide';
const TD_CLS = 'py-2 px-4 text-[11px]';

// ─── Section header: gold bar with white text and circled letter badge ──
const SectionHeader: React.FC<{ letter: string; title: string; subtitle?: string }> = ({ letter, title, subtitle }) => (
  <div className="mx-5 flex items-center gap-3 px-4 py-2.5 bg-[#B3893A] rounded-t-lg">
    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{letter}</span>
    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{title}</span>
    {subtitle && (
      <span className="ml-auto text-[10px] text-white/80 font-mono">{subtitle}</span>
    )}
  </div>
);

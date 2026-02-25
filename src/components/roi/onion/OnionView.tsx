import { useState } from "react";
import { Settings, X, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputs, OICalculations, PaymentMilestone } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { Currency, calculateAverageMonthlyRent } from "@/components/roi/currencyUtils";
import { calculateExitScenario, calculateExitPrice, ExitScenarioResult } from "@/components/roi/constructionProgress";

const CURRENCIES: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'COP'];

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
  setCurrency?: (c: Currency) => void;
  setLanguage?: (l: string) => void;
  exportMode?: boolean;
  notes?: Record<string, string>;
  onNotesChange?: (notes: Record<string, string>) => void;
}

// --- Detail Modal ---
const DetailModal = ({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-theme-card border border-theme-border rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-theme-border">
          <h3 className="text-sm font-bold text-theme-text uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-theme-card-alt transition-colors">
            <X className="w-4 h-4 text-theme-text-muted" />
          </button>
        </div>
        <div className="p-4 text-xs">{children}</div>
      </div>
    </div>
  );
};

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
  language,
  onEditClick,
  setCurrency,
  setLanguage,
  exportMode = false,
  notes: externalNotes,
  onNotesChange,
}: OnionViewProps) => {
  const [exitDetailModal, setExitDetailModal] = useState(false);
  const [mortgageDetailModal, setMortgageDetailModal] = useState(false);
  const [postHODetailModal, setPostHODetailModal] = useState(false);
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>({});

  // Use external notes if provided, otherwise internal state
  const notes = externalNotes ?? internalNotes;
  const updateNote = (key: string, value: string) => {
    const updated = { ...notes, [key]: value };
    if (onNotesChange) onNotesChange(updated);
    else setInternalNotes(updated);
  };

  // Note cell renderer — input in normal mode, plain text in export
  const NoteCell = ({ noteKey, className = "" }: { noteKey: string; className?: string }) => (
    <td className={`py-1.5 px-2 text-right align-top ${className}`}>
      {exportMode ? (
        <span className="text-[8px] text-theme-text-muted">{notes[noteKey] || ''}</span>
      ) : (
        <input
          type="text"
          value={notes[noteKey] || ''}
          onChange={(e) => updateNote(noteKey, e.target.value)}
          placeholder="Add note..."
          className="w-full text-right text-[8px] bg-transparent border-none outline-none text-theme-text-muted placeholder:text-theme-text-muted/40 focus:text-theme-text"
        />
      )}
    </td>
  );

  // --- DATA PREPARATION ---
  const basePrice = calculations.basePrice;
  const projectName = clientInfo?.projectName || (inputs as any).snapshotTitle || "Project Name";
  const eoiFee = inputs.eoiFee || 0;

  const dpPercent = inputs.downpaymentPercent || 20;
  const dpTotal = (basePrice * dpPercent) / 100;
  const spaPayment = Math.max(0, dpTotal - eoiFee);

  const dldFee = basePrice * 0.04;
  const adminFee = inputs.oqoodFee || 0;
  const totalDay1 = dpTotal + dldFee + adminFee;

  const additionalPayments = inputs.additionalPayments || [];
  const totalInstallments = additionalPayments.reduce((sum, p) => sum + (basePrice * (p.paymentPercent || 0) / 100), 0);

  const handoverPct = inputs.hasPostHandoverPlan
    ? (inputs.onHandoverPercent || 0)
    : (100 - (inputs.preHandoverPercent || 0));
  const handoverPayment = basePrice * handoverPct / 100;

  const totalCashNeeded = totalDay1 + totalInstallments + handoverPayment;

  // Rental calculations
  const grossAnnualRent = calculations.holdAnalysis.annualRent;
  const grossMonthlyRent = grossAnnualRent / 12;
  const grossYield = basePrice > 0 ? (grossAnnualRent / basePrice) * 100 : 0;

  const serviceChargeSqft = inputs.serviceChargePerSqft || 18;
  const unitSize = inputs.unitSizeSqf || 0;
  const annualServiceCharge = serviceChargeSqft * unitSize;
  const monthlyServiceCharge = annualServiceCharge / 12;

  const netMonthlyIncome = grossMonthlyRent - monthlyServiceCharge;
  const netAnnualIncome = netMonthlyIncome * 12;
  const netYield = basePrice > 0 ? (netAnnualIncome / basePrice) * 100 : 0;

  // Exit scenarios
  const exitResults: (ExitScenarioResult & { months: number })[] = exitScenarios.map(months => ({
    ...calculateExitScenario(months, basePrice, calculations.totalMonths, inputs, calculations.totalEntryCosts),
    months,
  }));

  // Consistent display: if exit costs enabled, show net values for both profit and ROE
  const getDisplay = (sc: ExitScenarioResult) => ({
    profit: sc.exitCosts > 0 ? sc.netProfit : sc.trueProfit,
    annualizedROE: sc.exitCosts > 0 ? sc.netAnnualizedROE : sc.annualizedROE,
  });
  // Mortgage
  const hasMortgage = mortgageInputs.enabled;
  const monthlyMortgageTotal = hasMortgage
    ? mortgageAnalysis.monthlyPayment + (mortgageAnalysis.totalAnnualInsurance / 12)
    : 0;
  const mortgageCashflow = netMonthlyIncome - monthlyMortgageTotal;
  const mortgageCoverage = monthlyMortgageTotal > 0 ? (netMonthlyIncome / monthlyMortgageTotal) * 100 : 0;

  // Post-handover
  const hasPostHO = inputs.hasPostHandoverPlan;
  let postHOPayments: PaymentMilestone[] = inputs.postHandoverPayments || [];
  if (postHOPayments.length === 0 && inputs.additionalPayments?.length > 0) {
    const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handoverDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1, 28);
    postHOPayments = inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return false;
      const payDate = new Date(bookingDate);
      payDate.setMonth(payDate.getMonth() + p.triggerValue);
      return payDate > handoverDate;
    });
  }
  const showPostHO = hasPostHO && postHOPayments.length > 0;

  let postHOPercent = 0, postHOTotal = 0, postHOMonthly = 0, postHOAvgRent = 0, postHOCashflow = 0, postHOCoverage = 0, postHODurationMonths = 1;
  if (showPostHO) {
    postHOPercent = postHOPayments.reduce((s, p) => s + p.paymentPercent, 0);
    postHOTotal = basePrice * (postHOPercent / 100);
    const months = postHOPayments.map(p => p.triggerValue);
    postHODurationMonths = Math.max(1, Math.max(...months) - Math.min(...months) + 1);
    postHOMonthly = postHOTotal / postHODurationMonths;
    postHOAvgRent = calculateAverageMonthlyRent(netMonthlyIncome, inputs.rentGrowthRate || 4, Math.ceil(postHODurationMonths / 12));
    postHOCashflow = postHOAvgRent - postHOMonthly;
    const tenantContrib = postHOAvgRent * postHODurationMonths;
    postHOCoverage = postHOTotal > 0 ? Math.min(100, (tenantContrib / postHOTotal) * 100) : 0;
  }

  // Eligibility milestones
  const resellThreshold = (inputs as any).resellEligiblePercent ?? 30;
  const mortgageThreshold = (inputs as any).mortgageEligiblePercent ?? 50;

  // Only show secondary currency columns when a non-AED currency is selected
  const showSecondary = currency !== 'AED';

  // Format helper
  const n2s = (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Shared styles
  const thSection = "py-1.5 px-3 text-left font-bold uppercase tracking-wide text-[11px]";
  const tdLabel = "py-1.5 px-3 bg-theme-card-alt text-theme-text font-medium";
  const tdValue = "py-1.5 px-3 text-center font-mono text-theme-text";
  const rowHover = "hover:bg-theme-accent/5 transition-colors";
  const sectionHeader = "bg-theme-accent text-white";
  const badge = "bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-bold";

  return (
    <div className="min-h-full bg-theme-bg text-theme-text p-4 sm:p-6 lg:p-8 pt-4 pb-20 font-sans">
      <div className="max-w-[1100px] mx-auto">

        {/* === HEADER ROW === */}
        <div className="flex flex-col lg:grid lg:grid-cols-[30%_1fr_25%] gap-4 mb-6">

          {/* Client Info */}
          <div className="text-[10px]">
            <div className="rounded-lg overflow-hidden border border-theme-border shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th colSpan={2} className={`${sectionHeader} py-1.5 px-3 text-center text-[10px] uppercase font-bold tracking-wide`}>
                      Client and Unit Information
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Developer', clientInfo?.developer],
                    ['Client Name', clientInfo?.clients?.[0]?.name],
                    ['Client Country', clientInfo?.clients?.[0]?.country],
                    ['Broker', clientInfo?.brokerName],
                    ['Unit', clientInfo?.unit],
                    ['Size (sqf)', n2s(inputs.unitSizeSqf || 0)],
                    ['Type (beds)', clientInfo?.unitType],
                    ['Purchase Price', `AED ${n2s(basePrice)}`, true],
                    ...(showSecondary ? [
                      ['Currency', currency],
                      ['Converted', `${currency} ${n2s(basePrice * rate)}`, true],
                    ] : []),
                  ].map(([label, value, bold], i) => (
                    <tr key={i} className={`border-t border-theme-border ${rowHover}`}>
                      <td className="bg-theme-card-alt py-1 px-2 font-semibold text-theme-text w-1/2">{label}</td>
                      <td className={`py-1 px-2 text-center text-theme-text ${bold ? 'font-bold font-mono' : ''}`}>
                        {value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Title & Snapshot */}
          <div className="flex flex-col items-center pt-2">
            <h1 className="text-lg sm:text-xl font-bold uppercase text-theme-text tracking-tight mb-1">Monthly Cashflow Statement</h1>
            <h2 className="text-base sm:text-lg font-bold uppercase text-theme-accent mb-2">{projectName}</h2>

            {/* Currency & Language toggles */}
            {!exportMode && (setCurrency || setLanguage) && (
              <div className="flex items-center gap-2 mb-3">
                {setCurrency && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-theme-card-alt border border-theme-border text-theme-text hover:border-theme-accent hover:text-theme-accent transition-colors cursor-pointer">
                    <Globe className="w-3 h-3" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="bg-transparent border-none outline-none text-[10px] font-medium cursor-pointer appearance-none pr-1"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
                {setLanguage && (
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-theme-card-alt border border-theme-border text-theme-text hover:border-theme-accent hover:text-theme-accent transition-colors"
                  >
                    <Languages className="w-3 h-3" />
                    {(language || 'en').toUpperCase()}
                  </button>
                )}
              </div>
            )}

            <div className="w-full rounded-lg overflow-hidden border border-theme-border shadow-sm">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr>
                    <th colSpan={2} className={`${sectionHeader} text-center py-1.5 font-bold uppercase tracking-wider text-[10px]`}>
                      Snapshot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className="py-1.5 px-3 text-theme-text">Payment on SPA</td>
                    <td className="py-1.5 px-3 text-right font-mono text-theme-text">({n2s(totalDay1)}) AED</td>
                  </tr>
                  <tr className={`border-t border-theme-border bg-theme-card-alt ${rowHover}`}>
                    <td className="py-1.5 px-3 text-theme-text">Additional Deposits</td>
                    <td className="py-1.5 px-3 text-right font-mono text-theme-text">({n2s(totalInstallments)}) AED</td>
                  </tr>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className="py-1.5 px-3 text-theme-text">Payment on Handover</td>
                    <td className="py-1.5 px-3 text-right font-mono text-theme-text">({n2s(handoverPayment)}) AED</td>
                  </tr>
                  <tr className="border-t-2 border-theme-accent/30">
                    <td className="py-1.5 px-3 font-bold bg-theme-accent text-white">Total Equity Required</td>
                    <td className="py-1.5 px-3 text-right font-bold font-mono bg-theme-accent text-white">({n2s(totalCashNeeded)}) AED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Logo & ROI */}
          <div className="flex flex-col items-center lg:items-end">
            {quoteImages?.heroImageUrl ? (
              <img src={quoteImages.heroImageUrl} alt="Logo" className="h-16 object-contain mb-4 mix-blend-multiply" />
            ) : (
              <div className="h-16 mb-4 w-full max-w-[200px] border border-dashed border-theme-border rounded-lg flex items-center justify-center text-theme-text-muted text-xs">
                Logo / Hero
              </div>
            )}

            <div className="w-full rounded-lg overflow-hidden border border-theme-border shadow-sm">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr>
                    <th colSpan={3} className={`${sectionHeader} text-center py-1.5 font-bold uppercase tracking-wider text-[10px]`}>
                      Projected ROI
                    </th>
                  </tr>
                  <tr className="bg-theme-card-alt border-b border-theme-border">
                    <th className="py-1 px-2 text-theme-text-muted text-[9px]">Exit</th>
                    <th className="py-1 px-2 text-theme-text-muted text-[9px]">ROE</th>
                    <th className="py-1 px-2 text-right text-theme-text-muted text-[9px]">Sale Price</th>
                  </tr>
                </thead>
                <tbody>
                  {exitResults.slice(0, 2).map((sc, i) => {
                    const d = getDisplay(sc);
                    return (
                      <tr key={i} className={`border-t border-theme-border ${rowHover}`}>
                        <td className="py-1.5 px-2 font-semibold text-theme-text">{sc.months} mo</td>
                        <td className="py-1.5 px-2 text-center font-bold text-theme-positive">{d.annualizedROE.toFixed(1)}%</td>
                        <td className="py-1.5 px-2 text-right font-mono text-theme-text">AED {n2s(sc.exitPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* === SECTION A: INITIAL COST === */}
        <div className="mb-6 text-[10px]">
          <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className={sectionHeader}>
                  <th className={`${thSection} ${showSecondary ? 'w-[35%]' : 'w-[40%]'}`}>
                    <span className="inline-flex items-center gap-1.5"><span className={badge}>A</span> Initial Cost</span>
                  </th>
                  <th className="py-1.5 px-3 w-[15%]"></th>
                  <th className="py-1.5 px-3 text-center underline text-[10px]">AED</th>
                  {showSecondary && <th className="py-1.5 px-3 text-center underline text-[10px]">{currency}</th>}
                  <th className="py-1.5 px-3 text-right text-[9px] font-normal opacity-80">Notes</th>
                </tr>
              </thead>
              <tbody>
                {eoiFee > 0 && (
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>A1. Holding Fee</td>
                    <td className={`${tdValue} text-theme-text-muted text-[9px]`}>{n2s(eoiFee)} Holding</td>
                    <td className={tdValue}>({n2s(eoiFee)})</td>
                    {showSecondary && <td className={tdValue}>({n2s(eoiFee * rate)})</td>}
                    <NoteCell noteKey="a-eoi" />
                  </tr>
                )}
                <tr className={`border-t border-theme-border ${rowHover}`}>
                  <td className={tdLabel}>A2. Signed Purchase Agreement</td>
                  <td className={`${tdValue} text-theme-text-muted text-[9px]`}>{dpPercent}% of Price</td>
                  <td className={tdValue}>({n2s(spaPayment)})</td>
                  {showSecondary && <td className={tdValue}>({n2s(spaPayment * rate)})</td>}
                  <NoteCell noteKey="a-spa" />
                </tr>
                <tr className={`border-t border-theme-border ${rowHover}`}>
                  <td className={tdLabel}>A3. Dubai Land Dept Fee</td>
                  <td className={`${tdValue} text-theme-text-muted text-[9px]`}>4% of Price</td>
                  <td className={tdValue}>({n2s(dldFee)})</td>
                  {showSecondary && <td className={tdValue}>({n2s(dldFee * rate)})</td>}
                  <NoteCell noteKey="a-dld" />
                </tr>
                {adminFee > 0 && (
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>A4. Oqood Fees</td>
                    <td className={`${tdValue} text-theme-text-muted text-[9px]`}>Admin</td>
                    <td className={tdValue}>({n2s(adminFee)})</td>
                    {showSecondary && <td className={tdValue}>({n2s(adminFee * rate)})</td>}
                    <NoteCell noteKey="a-oqood" />
                  </tr>
                )}
                <tr className="border-t-2 border-theme-accent/30 bg-theme-card-alt font-semibold">
                  <td colSpan={2} className="py-2 px-3 text-right pr-8 text-theme-text">Cash to Start</td>
                  <td className="py-2 px-3 text-center font-mono text-theme-text">({n2s(totalDay1)})</td>
                  {showSecondary && <td className="py-2 px-3 text-center font-mono text-theme-text">({n2s(totalDay1 * rate)})</td>}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === SECTION B: MILESTONE EVENT === */}
        <div className="mb-6 text-[10px]">
          <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className={sectionHeader}>
                  <th className={`${thSection} ${showSecondary ? 'w-[35%]' : 'w-[40%]'}`}>
                    <span className="inline-flex items-center gap-1.5"><span className={badge}>B</span> Milestone Event</span>
                  </th>
                  <th className="py-1.5 px-3 w-[15%]"></th>
                  <th className="py-1.5 px-3 text-center underline text-[10px]">AED</th>
                  {showSecondary && <th className="py-1.5 px-3 text-center underline text-[10px]">{currency}</th>}
                  <th className="py-1.5 px-3 text-right text-[9px] font-normal opacity-80">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumPercent = dpPercent;
                  let resellShown = cumPercent >= resellThreshold;
                  let mortgageShown = cumPercent >= mortgageThreshold;
                  const rows: React.ReactNode[] = [];

                  additionalPayments.forEach((p, i) => {
                    const amount = basePrice * (p.paymentPercent || 0) / 100;
                    cumPercent += p.paymentPercent || 0;
                    const suffix = i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th';

                    // Check eligibility thresholds for inline badges
                    const badges: string[] = [];
                    if (!resellShown && cumPercent >= resellThreshold) {
                      resellShown = true;
                      badges.push('Resale');
                    }
                    if (!mortgageShown && cumPercent >= mortgageThreshold) {
                      mortgageShown = true;
                      badges.push('Mortgage');
                    }

                    rows.push(
                      <tr key={`inst-${i}`} className={`border-t border-theme-border ${rowHover}`}>
                        <td className={tdLabel}>
                          {i + 1}{suffix} Installment
                          {badges.map(b => (
                            <span key={b} className="ml-1.5 text-[7px] px-1 py-0.5 rounded bg-theme-accent/15 text-theme-accent font-bold uppercase">
                              ✓ {b}
                            </span>
                          ))}
                        </td>
                        <td className={`${tdValue} text-theme-text-muted text-[9px]`}>
                          <span className="block max-w-[180px] truncate mx-auto">{p.paymentPercent}% {p.label || 'Construction'}</span>
                        </td>
                        <td className={tdValue}>({n2s(amount)})</td>
                        {showSecondary && <td className={tdValue}>({n2s(amount * rate)})</td>}
                        <NoteCell noteKey={`b-inst-${i}`} />
                      </tr>
                    );
                  });

                  return rows;
                })()}

                {/* Handover */}
                <tr className="bg-theme-positive/10 border-y border-theme-positive/20">
                  <td className="py-2 px-3 font-bold text-theme-text">Completion Payment</td>
                  <td className="py-2 px-3 text-center font-bold text-theme-text text-[9px]">{handoverPct}%</td>
                  <td className="py-2 px-3 text-center font-bold font-mono text-theme-positive">({n2s(handoverPayment)})</td>
                  {showSecondary && <td className="py-2 px-3 text-center font-bold font-mono text-theme-positive">({n2s(handoverPayment * rate)})</td>}
                  <NoteCell noteKey="b-handover" />
                </tr>

                {/* Total */}
                <tr className="bg-theme-accent text-white font-bold text-xs">
                  <td colSpan={2} className="py-2 px-3 text-right pr-8">Total Equity Required</td>
                  <td className="py-2 px-3 text-center font-mono">({n2s(totalCashNeeded)})</td>
                  {showSecondary && <td className="py-2 px-3 text-center font-mono">({n2s(totalCashNeeded * rate)})</td>}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === SECTION C: PROJECTED RENTAL INCOME === */}
        <div className="mb-6 text-[10px]">
          <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className={sectionHeader}>
                  <th className={`${thSection} ${showSecondary ? 'w-[26%]' : 'w-[36%]'}`}>
                    <span className="inline-flex items-center gap-1.5"><span className={badge}>C</span> Projected Rental Income</span>
                  </th>
                  <th className="py-1.5 px-3 text-center text-[9px] font-normal">Monthly{showSecondary ? ' AED' : ''}</th>
                  <th className="py-1.5 px-3 text-center text-[9px] font-normal">Annual{showSecondary ? ' AED' : ''}</th>
                  {showSecondary && (
                    <>
                      <th className="py-1.5 px-3 text-center text-[9px] font-normal">Monthly {currency}</th>
                      <th className="py-1.5 px-3 text-center text-[9px] font-normal">Annual {currency}</th>
                    </>
                  )}
                  <th className="py-1.5 px-3 text-right text-[9px] font-normal opacity-80">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-t border-theme-border bg-theme-card-alt ${rowHover}`}>
                  <td className="py-1.5 px-3 font-medium text-theme-text">Gross Rental Income</td>
                  <td className={tdValue}>{n2s(grossMonthlyRent)}</td>
                  <td className={tdValue}>{n2s(grossAnnualRent)}</td>
                  {showSecondary && <td className={tdValue}>{n2s(grossMonthlyRent * rate)}</td>}
                  {showSecondary && <td className={tdValue}>{n2s(grossAnnualRent * rate)}</td>}
                  <NoteCell noteKey="c-gross-rent" />
                </tr>
                <tr className={`border-t border-theme-border ${rowHover}`}>
                  <td className="py-1.5 px-3 font-medium text-theme-negative">− Service Charges</td>
                  <td className={`${tdValue} text-theme-negative`}>({n2s(monthlyServiceCharge)})</td>
                  <td className={`${tdValue} text-theme-negative`}>({n2s(annualServiceCharge)})</td>
                  {showSecondary && <td className={`${tdValue} text-theme-negative`}>({n2s(monthlyServiceCharge * rate)})</td>}
                  {showSecondary && <td className={`${tdValue} text-theme-negative`}>({n2s(annualServiceCharge * rate)})</td>}
                  <NoteCell noteKey="c-service-charges" />
                </tr>
                <tr className="border-t-2 border-theme-accent/30 bg-theme-card-alt font-bold">
                  <td className="py-2 px-3 text-theme-text">Net Rental Income</td>
                  <td className={`${tdValue} font-bold`}>{n2s(netMonthlyIncome)}</td>
                  <td className={`${tdValue} font-bold`}>{n2s(netAnnualIncome)}</td>
                  {showSecondary && <td className={`${tdValue} font-bold`}>{n2s(netMonthlyIncome * rate)}</td>}
                  {showSecondary && <td className={`${tdValue} font-bold`}>{n2s(netAnnualIncome * rate)}</td>}
                  <NoteCell noteKey="c-net-rent" />
                </tr>
                <tr className="bg-theme-positive/15 border-t border-theme-positive/20">
                  <td className="py-1.5 px-3 font-bold text-theme-positive">Gross Yield</td>
                  <td colSpan={showSecondary ? 4 : 2} className="py-1.5 px-3 text-center font-bold text-theme-positive">{grossYield.toFixed(1)}%</td>
                  <td></td>
                </tr>
                <tr className="bg-theme-positive/15 border-t border-theme-positive/20">
                  <td className="py-1.5 px-3 font-bold text-theme-positive">Net Yield</td>
                  <td colSpan={showSecondary ? 4 : 2} className="py-1.5 px-3 text-center font-bold text-theme-positive">{netYield.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === SECTION D: ANNUAL NET CASH POSITION === */}
        <div className="mb-6 text-[10px]">
          <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className={sectionHeader}>
                  <th colSpan={12} className={thSection}>
                    <span className="inline-flex items-center gap-1.5"><span className={badge}>D</span> Annual Net Cash Position</span>
                  </th>
                </tr>
                <tr className="bg-theme-card-alt border-b border-theme-border text-theme-text-muted">
                  <th className="py-1.5 px-2" style={{ width: '14%' }}></th>
                  <th className="py-1.5 px-1" style={{ width: '4%' }}></th>
                  {[1,2,3,4,5,6,7,8,9,10].map(y => <th key={y} className="py-1.5 px-1 text-center font-medium">Yr {y}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className={rowHover}>
                  <td className="py-2 px-2 font-semibold text-theme-text">Net Annual Cash</td>
                  <td className="py-2 px-1 text-center font-medium text-theme-text-muted">AED</td>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <td key={i} className="py-2 px-1 text-center font-mono text-theme-positive border-l border-theme-border">
                      {n2s(netAnnualIncome * Math.pow(1 + (inputs.rentGrowthRate || 5) / 100, i))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === SECTION E: EXIT SCENARIOS === */}
        {exitResults.length > 0 && (
          <div className="mb-6 text-[10px]">
            <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
              {/* Exit Profit & ROE Bar Chart */}
              {(() => {
                const W = 600, H = 180, padL = 65, padR = 15, padT = 25, padB = 35;
                const chartW = W - padL - padR;
                const chartH = H - padT - padB;
                const barCount = exitResults.length;
                if (barCount === 0) return null;

                const profits = exitResults.map(sc => getDisplay(sc).profit);
                const maxProfit = Math.max(...profits, 1);
                const minProfit = Math.min(...profits, 0);
                const range = maxProfit - minProfit || 1;

                // Y position: 0-line, positive bars go up, negative go down
                const zeroY = padT + (maxProfit / range) * chartH;
                const barGap = 8;
                const totalGap = barGap * (barCount + 1);
                const barW = Math.min(50, (chartW - totalGap) / barCount);
                const groupW = barW + barGap;
                const startX = padL + (chartW - groupW * barCount) / 2 + barGap / 2;

                return (
                  <div className="p-3 border-b border-theme-border bg-theme-card">
                    <div className="text-[9px] font-medium text-theme-text-muted mb-1">Exit Profit & ROE</div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '200px' }}>
                      {/* Zero line */}
                      <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY}
                        stroke="hsl(var(--theme-border))" strokeWidth="1" strokeDasharray="4 3" />
                      <text x={padL - 4} y={zeroY + 3} textAnchor="end" fontSize="7" fill="hsl(var(--theme-text-muted))">0</text>

                      {/* Bars */}
                      {exitResults.map((sc, i) => {
                        const d = getDisplay(sc);
                        const x = startX + i * groupW;
                        const barH = Math.abs(d.profit / range) * chartH;
                        const isPositive = d.profit >= 0;
                        const y = isPositive ? zeroY - barH : zeroY;
                        const isHandover = sc.months === calculations.totalMonths;
                        const fill = isPositive ? "hsl(var(--theme-positive))" : "hsl(var(--theme-negative))";

                        return (
                          <g key={i}>
                            {/* Handover highlight */}
                            {isHandover && (
                              <rect x={x - 2} y={padT} width={barW + 4} height={chartH}
                                fill="hsl(var(--theme-accent))" opacity="0.06" rx="2" />
                            )}
                            {/* Bar */}
                            <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} fill={fill} opacity="0.8" rx="2" />
                            {/* ROE label above/below bar */}
                            <text x={x + barW / 2} y={isPositive ? y - 10 : y + barH + 10}
                              textAnchor="middle" fontSize="8" fontWeight="bold" fill="hsl(var(--theme-accent))">
                              {d.annualizedROE.toFixed(1)}%
                            </text>
                            {/* Profit value */}
                            <text x={x + barW / 2} y={isPositive ? y - 2 : y + barH + 2}
                              textAnchor="middle" fontSize="6" fill="hsl(var(--theme-text-muted))">
                              {isPositive ? '+' : ''}{n2s(d.profit)}
                            </text>
                            {/* Month label */}
                            <text x={x + barW / 2} y={H - padB + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--theme-text-muted))">
                              {sc.months}mo
                            </text>
                            {/* Handover label */}
                            {isHandover && (
                              <text x={x + barW / 2} y={H - padB + 20} textAnchor="middle" fontSize="6" fontWeight="bold" fill="hsl(var(--theme-accent))">
                                HO
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* X-axis */}
                      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="hsl(var(--theme-border))" strokeWidth="1" />
                    </svg>
                  </div>
                );
              })()}

              {/* Exit table */}
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className={sectionHeader}>
                    <th className={`${thSection}`}>
                      <span className="inline-flex items-center gap-1.5"><span className={badge}>E</span> Exit Scenarios</span>
                    </th>
                    <th className="py-1.5 px-2 text-center text-[9px] font-normal">Exit Price</th>
                    <th className="py-1.5 px-2 text-center text-[9px] font-normal">Net Profit</th>
                    <th className="py-1.5 px-2 text-center text-[9px] font-normal">Ann. ROE</th>
                    <th className="py-1.5 px-2 text-right text-[9px] font-normal opacity-80">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {exitResults.map((sc, i) => {
                    const isHandover = sc.months === calculations.totalMonths;
                    const d = getDisplay(sc);
                    return (
                      <tr key={i} className={`border-t border-theme-border ${rowHover}`}>
                        <td className={tdLabel}>
                          Exit {i + 1}: {sc.months} months
                          {isHandover && <span className="ml-1.5 text-[8px] px-1 py-0.5 rounded bg-theme-positive/10 text-theme-positive font-bold">HANDOVER</span>}
                        </td>
                        <td className={tdValue}>AED {n2s(sc.exitPrice)}</td>
                        <td className={`${tdValue} font-bold ${d.profit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                          {d.profit >= 0 ? '+' : ''}{n2s(d.profit)}
                        </td>
                        <td className={`${tdValue} font-bold text-theme-accent`}>{d.annualizedROE.toFixed(1)}%</td>
                        <NoteCell noteKey={`e-exit-${i}`} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* View Details button */}
              {!exportMode && (
                <div className="p-2 border-t border-theme-border text-center">
                  <button
                    onClick={() => setExitDetailModal(true)}
                    className="text-[10px] font-medium text-theme-accent hover:underline"
                  >
                    View Full Analysis →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === SECTION F: MORTGAGE (conditional) === */}
        {hasMortgage && (
          <div className="mb-6 text-[10px]">
            <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr className={sectionHeader}>
                    <th className={`${thSection}`}>
                      <span className="inline-flex items-center gap-1.5"><span className={badge}>F</span> Financing</span>
                    </th>
                    <th className="py-1.5 px-3 text-right text-[9px] font-normal opacity-80">
                      {mortgageInputs.financingPercent}% • {mortgageInputs.loanTermYears}yr • {mortgageInputs.interestRate}%
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Loan Amount</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(mortgageAnalysis.loanAmount)}</td>
                  </tr>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Monthly Payment (+ Insurance)</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(monthlyMortgageTotal)}</td>
                  </tr>
                  {mortgageAnalysis.hasGap && (
                    <tr className={`border-t border-theme-border ${rowHover}`}>
                      <td className={tdLabel}>Gap to Cover</td>
                      <td className={`${tdValue} text-right text-theme-negative font-bold`}>AED {n2s(mortgageAnalysis.gapAmount)}</td>
                    </tr>
                  )}
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Net Monthly Rent</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(netMonthlyIncome)}</td>
                  </tr>
                  <tr className={`border-t-2 border-theme-accent/30 font-bold ${mortgageCashflow >= 0 ? 'bg-theme-positive/10' : 'bg-theme-negative/10'}`}>
                    <td className={`py-2 px-3 ${mortgageCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      Monthly Cashflow
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${mortgageCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      {mortgageCashflow >= 0 ? '+' : ''}AED {n2s(mortgageCashflow)}
                    </td>
                  </tr>
                  <tr className="bg-theme-positive/15 border-t border-theme-positive/20">
                    <td className="py-1.5 px-3 font-bold text-theme-positive">Rent Coverage</td>
                    <td className="py-1.5 px-3 text-right font-bold text-theme-positive">{mortgageCoverage.toFixed(0)}%</td>
                  </tr>
                </tbody>
              </table>
              {!exportMode && (
                <div className="p-2 border-t border-theme-border text-center">
                  <button
                    onClick={() => setMortgageDetailModal(true)}
                    className="text-[10px] font-medium text-theme-accent hover:underline"
                  >
                    View Financing Details →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === SECTION G: POST-HANDOVER COVERAGE (conditional) === */}
        {showPostHO && (
          <div className="mb-6 text-[10px]">
            <div className="overflow-x-auto rounded-lg border border-theme-border shadow-sm">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr className={sectionHeader}>
                    <th className={`${thSection}`}>
                      <span className="inline-flex items-center gap-1.5"><span className={badge}>G</span> Post-Handover Coverage</span>
                    </th>
                    <th className="py-1.5 px-3 text-right text-[9px] font-normal opacity-80">
                      {postHODurationMonths}mo • {postHOPayments.length} payments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Post-HO Total ({postHOPercent.toFixed(0)}%)</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(postHOTotal)}</td>
                  </tr>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Monthly Payment</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(postHOMonthly)}</td>
                  </tr>
                  <tr className={`border-t border-theme-border ${rowHover}`}>
                    <td className={tdLabel}>Avg Monthly Rent</td>
                    <td className={`${tdValue} text-right`}>AED {n2s(postHOAvgRent)}</td>
                  </tr>
                  <tr className={`border-t-2 border-theme-accent/30 font-bold ${postHOCashflow >= 0 ? 'bg-theme-positive/10' : 'bg-theme-negative/10'}`}>
                    <td className={`py-2 px-3 ${postHOCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      Monthly {postHOCashflow >= 0 ? 'Surplus' : 'Gap'}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${postHOCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      {postHOCashflow >= 0 ? '+' : ''}AED {n2s(postHOCashflow)}
                    </td>
                  </tr>
                  <tr className={`border-t ${postHOCoverage >= 100 ? 'bg-theme-positive/15 border-theme-positive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                    <td className={`py-1.5 px-3 font-bold ${postHOCoverage >= 100 ? 'text-theme-positive' : 'text-amber-600'}`}>
                      Tenant Coverage
                    </td>
                    <td className={`py-1.5 px-3 text-right font-bold ${postHOCoverage >= 100 ? 'text-theme-positive' : 'text-amber-600'}`}>
                      {postHOCoverage.toFixed(0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
              {!exportMode && (
                <div className="p-2 border-t border-theme-border text-center">
                  <button
                    onClick={() => setPostHODetailModal(true)}
                    className="text-[10px] font-medium text-theme-accent hover:underline"
                  >
                    View Coverage Details →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* === MODALS (hidden in export mode) === */}
      {!exportMode && <>

      {/* Exit Detail Modal */}
      <DetailModal open={exitDetailModal} onClose={() => setExitDetailModal(false)} title="Exit Scenario Analysis">
        <div className="space-y-4">
          {exitResults.map((sc, i) => (
            <div key={i} className="border border-theme-border rounded-lg p-3">
              <div className="font-bold text-theme-text mb-2">
                Exit {i + 1}: {sc.months} months
                {sc.months === calculations.totalMonths && (
                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-theme-positive/10 text-theme-positive">HANDOVER</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-theme-text-muted">
                <span>Exit Price</span><span className="text-right font-mono text-theme-text">AED {n2s(sc.exitPrice)}</span>
                <span>Purchase Price</span><span className="text-right font-mono text-theme-text">AED {n2s(basePrice)}</span>
                <span>Appreciation</span><span className="text-right font-mono text-theme-positive">+AED {n2s(sc.appreciation)} ({sc.appreciationPercent.toFixed(1)}%)</span>
                <span className="border-t border-theme-border pt-1 mt-1">Equity Deployed</span><span className="text-right font-mono text-theme-text border-t border-theme-border pt-1 mt-1">AED {n2s(sc.equityDeployed)}</span>
                <span>Entry Costs (DLD+Oqood)</span><span className="text-right font-mono text-theme-negative">AED {n2s(sc.entryCosts)}</span>
                <span>Exit Costs (Agent+NOC)</span><span className="text-right font-mono text-theme-negative">AED {n2s(sc.exitCosts)}</span>
                <span>Total Capital In</span><span className="text-right font-mono text-theme-text">AED {n2s(sc.totalCapital)}</span>
                <span className="border-t border-theme-border pt-1 mt-1 font-bold text-theme-text">Net Profit</span>
                <span className={`text-right font-mono font-bold border-t border-theme-border pt-1 mt-1 ${getDisplay(sc).profit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                  {getDisplay(sc).profit >= 0 ? '+' : ''}AED {n2s(getDisplay(sc).profit)}
                </span>
                <span className="font-bold text-theme-text">Annualized ROE</span>
                <span className="text-right font-mono font-bold text-theme-accent">{getDisplay(sc).annualizedROE.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Mortgage Detail Modal */}
      {hasMortgage && (
        <DetailModal open={mortgageDetailModal} onClose={() => setMortgageDetailModal(false)} title="Financing Details">
          <div className="space-y-3 text-theme-text-muted">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Loan Amount</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.loanAmount)}</span>
              <span>Monthly Payment</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.monthlyPayment)}</span>
              <span>Monthly Insurance</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.totalAnnualInsurance / 12)}</span>
              <span className="font-bold text-theme-text">Total Monthly</span><span className="text-right font-mono font-bold text-theme-text">AED {n2s(monthlyMortgageTotal)}</span>
            </div>
            <div className="border-t border-theme-border pt-2">
              <div className="font-bold text-theme-text mb-1">Upfront Fees</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Processing Fee</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.processingFee)}</span>
                <span>Valuation Fee</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.valuationFee)}</span>
                <span>Mortgage Registration</span><span className="text-right font-mono text-theme-text">AED {n2s(mortgageAnalysis.mortgageRegistration)}</span>
                {mortgageAnalysis.hasGap && (
                  <><span>Gap Payment</span><span className="text-right font-mono text-theme-negative">AED {n2s(mortgageAnalysis.gapAmount)}</span></>
                )}
                <span className="font-bold text-theme-text">Total Upfront</span><span className="text-right font-mono font-bold text-theme-text">AED {n2s(mortgageAnalysis.totalUpfrontFees)}</span>
              </div>
            </div>
            <div className="border-t border-theme-border pt-2">
              <div className="font-bold text-theme-text mb-1">Principal Paid</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>After 5 years</span><span className="text-right font-mono text-theme-positive">AED {n2s(mortgageAnalysis.principalPaidYear5)}</span>
                <span>After 10 years</span><span className="text-right font-mono text-theme-positive">AED {n2s(mortgageAnalysis.principalPaidYear10)}</span>
                <span>Total Interest</span><span className="text-right font-mono text-theme-negative">AED {n2s(mortgageAnalysis.totalInterest)}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Post-HO Detail Modal */}
      {showPostHO && (
        <DetailModal open={postHODetailModal} onClose={() => setPostHODetailModal(false)} title="Post-Handover Coverage Details">
          <div className="space-y-3 text-theme-text-muted">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Post-HO Total</span><span className="text-right font-mono text-theme-text">AED {n2s(postHOTotal)} ({postHOPercent.toFixed(0)}%)</span>
              <span>Number of Payments</span><span className="text-right text-theme-text">{postHOPayments.length}</span>
              <span>Duration</span><span className="text-right text-theme-text">{postHODurationMonths} months</span>
              <span>Per Installment</span><span className="text-right font-mono text-theme-text">AED {n2s(postHOTotal / postHOPayments.length)}</span>
            </div>
            <div className="border-t border-theme-border pt-2">
              <div className="font-bold text-theme-text mb-1">Monthly Analysis</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Monthly Payment</span><span className="text-right font-mono text-theme-text">AED {n2s(postHOMonthly)}</span>
                <span>Avg Monthly Rent</span><span className="text-right font-mono text-theme-positive">AED {n2s(postHOAvgRent)}</span>
                <span className="font-bold text-theme-text">Cashflow</span>
                <span className={`text-right font-mono font-bold ${postHOCashflow >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                  {postHOCashflow >= 0 ? '+' : ''}AED {n2s(postHOCashflow)}/mo
                </span>
              </div>
            </div>
            <div className="border-t border-theme-border pt-2">
              <div className="font-bold text-theme-text mb-1">Total Coverage</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Tenant Contribution</span><span className="text-right font-mono text-theme-positive">AED {n2s(postHOAvgRent * postHODurationMonths)}</span>
                <span>Net Out-of-Pocket</span>
                <span className={`text-right font-mono font-bold ${postHOTotal - (postHOAvgRent * postHODurationMonths) > 0 ? 'text-theme-negative' : 'text-theme-positive'}`}>
                  AED {n2s(Math.max(0, postHOTotal - (postHOAvgRent * postHODurationMonths)))}
                </span>
                <span className="font-bold text-theme-text">Coverage</span>
                <span className={`text-right font-bold ${postHOCoverage >= 100 ? 'text-theme-positive' : 'text-amber-600'}`}>
                  {postHOCoverage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      </>}

      {!exportMode && onEditClick && (
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          <Button
            size="icon"
            onClick={onEditClick}
            className="h-12 w-12 rounded-full bg-theme-accent text-white shadow-lg hover:bg-theme-accent/90"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

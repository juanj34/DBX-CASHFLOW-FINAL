import React, { useMemo, useState } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { calculateExitScenario, ExitScenarioResult, isHandoverExit } from '@/components/roi/constructionProgress';
import { NoteCell } from './NoteCell';
import { DocumentControls, Currency } from './DocumentControls';
import { ExitBarChart } from './ExitBarChart';
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
}) => {
  const [exitDetailModal, setExitDetailModal] = useState<number | null>(null);
  const [mortgageDetailModal, setMortgageDetailModal] = useState(false);

  const { basePrice, totalMonths, yearlyProjections, holdAnalysis, totalEntryCosts } = calculations;
  const dldFee = basePrice * 0.04;

  // Currency conversion helper
  const cv = (aed: number) => currency === 'AED' ? aed : aed * rate;
  const cvf = (aed: number) => n2s(cv(aed));

  // Exit scenarios
  const scenarioMonths = exitScenarioMonths || inputs._exitScenarios || [totalMonths, totalMonths + 24, totalMonths + 60];
  const exitResults = useMemo(() => {
    return scenarioMonths.map((m) =>
      calculateExitScenario(m, basePrice, totalMonths, inputs, totalEntryCosts)
    );
  }, [scenarioMonths, basePrice, totalMonths, inputs, totalEntryCosts]);

  // Consistent exit display (net or true based on exit costs)
  const getDisplay = (sc: ExitScenarioResult) => ({
    profit: sc.exitCosts > 0 ? sc.netProfit : sc.trueProfit,
    annualizedROE: sc.exitCosts > 0 ? sc.netAnnualizedROE : sc.annualizedROE,
  });

  // Payment plan rows for Section B
  const paymentRows = useMemo(() => {
    const rows: { label: string; percent: number; amount: number; cumulative: number }[] = [];
    let cum = 0;

    // Downpayment
    cum += inputs.downpaymentPercent;
    rows.push({
      label: 'Downpayment (Booking)',
      percent: inputs.downpaymentPercent,
      amount: basePrice * inputs.downpaymentPercent / 100,
      cumulative: cum,
    });

    // Additional payments
    inputs.additionalPayments.forEach((m, i) => {
      if (m.paymentPercent <= 0) return;
      cum += m.paymentPercent;
      rows.push({
        label: m.label || `Installment ${i + 1}`,
        percent: m.paymentPercent,
        amount: basePrice * m.paymentPercent / 100,
        cumulative: cum,
      });
    });

    // Handover balance
    const handoverPercent = 100 - cum;
    if (handoverPercent > 0.5) {
      cum += handoverPercent;
      rows.push({
        label: 'On Handover',
        percent: Math.round(handoverPercent * 10) / 10,
        amount: basePrice * handoverPercent / 100,
        cumulative: cum,
      });
    }

    return rows;
  }, [inputs, basePrice]);

  // Rental calculations
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (inputs.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const grossYield = inputs.rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // Section header component
  const SectionHeader: React.FC<{ badge: string; title: string }> = ({ badge, title }) => (
    <tr>
      <td colSpan={99} className="py-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-theme-accent mt-4">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-theme-accent text-theme-bg">
            {badge}
          </span>
          <span className="text-[11px] font-semibold text-theme-text uppercase tracking-wider">{title}</span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-theme-card rounded-xl border border-theme-border shadow-xl overflow-hidden text-[11px]">
      {/* ============ HEADER ============ */}
      <div className="p-4 border-b border-theme-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: Project info */}
          <div>
            <h2 className="font-display text-xl text-theme-text">
              {clientInfo?.projectName || 'Investment Strategy'}
            </h2>
            {clientInfo?.developer && (
              <p className="text-xs text-theme-text-muted mt-0.5">by {clientInfo.developer}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-theme-text-muted">
              {clientInfo?.clientName && <span>{clientInfo.clientName}</span>}
              {clientInfo?.unitType && <span>{clientInfo.unitType.toUpperCase()}</span>}
              {clientInfo?.unitSize && <span>{clientInfo.unitSize} sqft</span>}
            </div>
          </div>

          {/* Right: Controls + Price */}
          <div className="flex flex-col items-end gap-2">
            {setCurrency && setLanguage && (
              <DocumentControls
                currency={currency}
                setCurrency={setCurrency}
                language={language}
                setLanguage={setLanguage}
                exportMode={exportMode}
              />
            )}
            <div className="text-right">
              <div className="font-mono text-lg font-semibold text-theme-accent">
                {currency} {cvf(basePrice)}
              </div>
              {currency !== 'AED' && (
                <div className="text-[10px] text-theme-text-muted font-mono">AED {n2s(basePrice)}</div>
              )}
            </div>
          </div>
        </div>

        {/* ROI snapshot — top 2 exit scenarios */}
        {exitResults.length >= 2 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {exitResults.slice(0, 2).map((sc, i) => {
              const d = getDisplay(sc);
              const months = scenarioMonths[i];
              const isHO = isHandoverExit(months, totalMonths);
              return (
                <div key={i} className="p-3 rounded-lg border border-theme-border bg-theme-bg">
                  <div className="text-[10px] text-theme-text-muted mb-1">
                    Exit at {months}m {isHO ? '(Handover)' : ''}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono text-sm font-semibold ${d.profit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      {d.profit >= 0 ? '+' : ''}{n2sShort(d.profit)}
                    </span>
                    <span className="font-mono text-xs text-theme-accent">
                      {d.annualizedROE.toFixed(1)}% /yr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ TABLE BODY ============ */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <tbody>
            {/* ===== SECTION A: Initial Cost ===== */}
            <SectionHeader badge="A" title="Initial Investment Cost" />
            {[
              { label: 'EOI / Booking Fee', value: inputs.eoiFee, key: 'a-eoi' },
              { label: `SPA Payment (${inputs.downpaymentPercent}%)`, value: basePrice * inputs.downpaymentPercent / 100, key: 'a-spa' },
              { label: 'DLD Fee (4%)', value: dldFee, key: 'a-dld' },
              { label: 'Oqood Fee', value: inputs.oqoodFee, key: 'a-oqood' },
            ].map((row) => (
              <tr key={row.key} className="border-t border-theme-border/50 hover:bg-theme-accent/5 transition-colors">
                <td className="py-1.5 px-3 text-theme-text-muted">{row.label}</td>
                <td className="py-1.5 px-3 text-right font-mono text-theme-text">{currency} {cvf(row.value)}</td>
                <td className="py-1.5 px-3 w-32">
                  <NoteCell noteKey={row.key} notes={notes} onNotesChange={onNotesChange} exportMode={exportMode} />
                </td>
              </tr>
            ))}
            <tr className="border-t border-theme-accent/20 bg-theme-accent/5">
              <td className="py-2 px-3 font-semibold text-theme-accent">Total Initial Cost</td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-theme-accent">
                {currency} {cvf(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}
              </td>
              <td className="py-2 px-3 w-32" />
            </tr>

            {/* ===== SECTION B: Payment Milestones ===== */}
            <SectionHeader badge="B" title="Payment Milestones" />
            <tr className="border-t border-theme-border/50 bg-theme-card-alt">
              <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted">#</td>
              <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">%</td>
              <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">Amount</td>
              <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">Cumulative</td>
            </tr>
            {paymentRows.map((row, i) => {
              const isHandover = row.label.includes('Handover');
              return (
                <tr
                  key={i}
                  className={`border-t border-theme-border/50 ${isHandover ? 'bg-theme-positive/5' : 'hover:bg-theme-accent/5'} transition-colors`}
                >
                  <td className={`py-1.5 px-3 ${isHandover ? 'text-theme-positive font-medium' : 'text-theme-text-muted'}`}>
                    {row.label}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-theme-text">{row.percent}%</td>
                  <td className="py-1.5 px-3 text-right font-mono text-theme-text">{currency} {cvf(row.amount)}</td>
                  <td className="py-1.5 px-3 text-right font-mono text-theme-text-muted">{row.cumulative.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="border-t border-theme-accent/20 bg-theme-accent/5">
              <td className="py-2 px-3 font-semibold text-theme-accent">Total Equity Required</td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-theme-accent">100%</td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-theme-accent">{currency} {cvf(basePrice)}</td>
              <td className="py-2 px-3" />
            </tr>

            {/* ===== SECTION C: Rental Income ===== */}
            <SectionHeader badge="C" title="Projected Rental Income" />
            {[
              { label: 'Gross Annual Rent', monthly: grossAnnualRent / 12, annual: grossAnnualRent, key: 'c-gross-rent', isPositive: true },
              { label: 'Service Charges', monthly: annualServiceCharges / 12, annual: annualServiceCharges, key: 'c-service-charges', isNegative: true },
              { label: 'Net Annual Rent', monthly: netAnnualRent / 12, annual: netAnnualRent, key: 'c-net-rent', isTotal: true },
            ].map((row) => (
              <tr
                key={row.key}
                className={`border-t border-theme-border/50 ${row.isTotal ? 'bg-theme-accent/5' : 'hover:bg-theme-accent/5'} transition-colors`}
              >
                <td className={`py-1.5 px-3 ${row.isTotal ? 'font-semibold text-theme-accent' : 'text-theme-text-muted'}`}>
                  {row.label}
                </td>
                <td className={`py-1.5 px-3 text-right font-mono ${
                  row.isNegative ? 'text-theme-negative' : row.isTotal ? 'text-theme-accent font-semibold' : 'text-theme-text'
                }`}>
                  {currency} {row.isNegative ? `(${cvf(row.monthly)})` : cvf(row.monthly)} /mo
                </td>
                <td className={`py-1.5 px-3 text-right font-mono ${
                  row.isNegative ? 'text-theme-negative' : row.isTotal ? 'text-theme-accent font-semibold' : 'text-theme-text'
                }`}>
                  {currency} {row.isNegative ? `(${cvf(row.annual)})` : cvf(row.annual)} /yr
                </td>
                <td className="py-1.5 px-3 w-28">
                  <NoteCell noteKey={row.key} notes={notes} onNotesChange={onNotesChange} exportMode={exportMode} />
                </td>
              </tr>
            ))}
            <tr className="border-t border-theme-border/50">
              <td className="py-1.5 px-3 text-theme-text-muted">Gross Yield</td>
              <td className="py-1.5 px-3 text-right font-mono text-theme-positive">{grossYield.toFixed(1)}%</td>
              <td className="py-1.5 px-3 text-theme-text-muted text-right">Net Yield</td>
              <td className="py-1.5 px-3 text-right font-mono text-theme-positive">{netYield.toFixed(1)}%</td>
            </tr>

            {/* ===== SECTION D: Annual Cash Position ===== */}
            <SectionHeader badge="D" title="Annual Net Cash Position" />
            <tr className="border-t border-theme-border/50">
              <td colSpan={99} className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-theme-card-alt">
                        <th className="py-1 px-2 text-left text-[10px] font-semibold text-theme-text-muted w-16">Label</th>
                        {Array.from({ length: 10 }, (_, i) => (
                          <th key={i} className="py-1 px-2 text-right text-[10px] font-semibold text-theme-text-muted">
                            Yr {i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1.5 px-2 text-[10px] text-theme-text-muted">Net Cash</td>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = i + 1;
                          let netCash = 0;
                          if (year > (calculations.yearlyProjections.find(p => p.isHandover)?.year || 999)) {
                            const yearsOfRent = year - (calculations.yearlyProjections.find(p => p.isHandover)?.year || 0);
                            netCash = netAnnualRent * Math.pow(1 + (inputs.rentGrowthRate || 4) / 100, yearsOfRent - 1);
                          }
                          const proj = yearlyProjections[i];
                          const value = proj?.netIncome ?? 0;
                          return (
                            <td key={i} className={`py-1.5 px-2 text-right font-mono text-[10px] ${
                              value > 0 ? 'text-theme-positive' : value < 0 ? 'text-theme-negative' : 'text-theme-text-muted'
                            }`}>
                              {value !== 0 ? n2sShort(value) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>

            {/* ===== SECTION E: Exit Scenarios ===== */}
            {exitResults.length > 0 && (
              <>
                <SectionHeader badge="E" title="Exit Scenarios" />
                {/* Chart */}
                <tr>
                  <td colSpan={99} className="p-3">
                    <ExitBarChart
                      exitResults={exitResults}
                      exitMonths={scenarioMonths}
                      totalMonths={totalMonths}
                      getDisplay={getDisplay}
                    />
                  </td>
                </tr>
                {/* Table */}
                <tr className="border-t border-theme-border/50 bg-theme-card-alt">
                  <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted">Exit</td>
                  <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">Price</td>
                  <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">Profit</td>
                  <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted text-right">ROE /yr</td>
                  <td className="py-1 px-3 text-[10px] font-semibold text-theme-text-muted w-24">Notes</td>
                </tr>
                {exitResults.map((sc, i) => {
                  const d = getDisplay(sc);
                  const months = scenarioMonths[i];
                  const isHO = isHandoverExit(months, totalMonths);
                  return (
                    <tr
                      key={i}
                      className={`border-t border-theme-border/50 ${isHO ? 'bg-theme-positive/5' : 'hover:bg-theme-accent/5'} transition-colors cursor-pointer`}
                      onClick={() => !exportMode && setExitDetailModal(i)}
                    >
                      <td className={`py-1.5 px-3 font-mono ${isHO ? 'text-theme-positive font-medium' : 'text-theme-text-muted'}`}>
                        {months}m {isHO && <span className="text-[9px]">HO</span>}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-theme-text">
                        {currency} {cvf(sc.exitPrice)}
                      </td>
                      <td className={`py-1.5 px-3 text-right font-mono font-medium ${d.profit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                        {d.profit >= 0 ? '+' : ''}{currency} {cvf(Math.abs(d.profit))}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-theme-accent font-medium">
                        {d.annualizedROE.toFixed(1)}%
                      </td>
                      <td className="py-1.5 px-3 w-24">
                        <NoteCell noteKey={`e-exit-${i}`} notes={notes} onNotesChange={onNotesChange} exportMode={exportMode} />
                      </td>
                    </tr>
                  );
                })}
              </>
            )}

            {/* ===== SECTION F: Hold Analysis ===== */}
            <SectionHeader badge="F" title="Buy & Hold Analysis" />
            {[
              { label: 'Total Capital Invested', value: holdAnalysis.totalCapitalInvested },
              { label: 'Property Value at Handover', value: holdAnalysis.propertyValueAtHandover },
              { label: 'Net Annual Rent (Year 1)', value: holdAnalysis.netAnnualRent },
              { label: 'Rental Yield on Investment', value: null, display: `${holdAnalysis.rentalYieldOnInvestment.toFixed(1)}%` },
              { label: 'Years to Break Even', value: null, display: `${holdAnalysis.yearsToBreakEven.toFixed(1)} years` },
            ].map((row, i) => (
              <tr key={i} className="border-t border-theme-border/50 hover:bg-theme-accent/5 transition-colors">
                <td className="py-1.5 px-3 text-theme-text-muted" colSpan={2}>{row.label}</td>
                <td className="py-1.5 px-3 text-right font-mono text-theme-text" colSpan={2}>
                  {row.display || `${currency} ${cvf(row.value!)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============ EXIT DETAIL MODAL ============ */}
      {exitDetailModal !== null && exitResults[exitDetailModal] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setExitDetailModal(null)}>
          <div
            className="bg-theme-card border border-theme-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-theme-border">
              <h3 className="font-display text-base text-theme-text">
                Exit at {scenarioMonths[exitDetailModal]}m — Full Analysis
              </h3>
              <button onClick={() => setExitDetailModal(null)} className="text-theme-text-muted hover:text-theme-text text-lg">&times;</button>
            </div>
            <div className="p-4 space-y-2 text-xs max-h-[60vh] overflow-y-auto">
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
                  { label: 'Annualized ROE', value: `${d.annualizedROE.toFixed(1)}%`, accent: true },
                ];
                return rows.map((r, j) => (
                  <div key={j} className="flex justify-between py-1 border-b border-theme-border/30 last:border-0">
                    <span className="text-theme-text-muted">{r.label}</span>
                    <span className={`font-mono font-medium ${
                      r.positive ? 'text-theme-positive' : r.negative ? 'text-theme-negative' : r.accent ? 'text-theme-accent' : 'text-theme-text'
                    }`}>{r.value}</span>
                  </div>
                ));
              })()}
              {!exitResults[exitDetailModal].isThresholdMet && (
                <div className="mt-3 p-3 rounded-lg bg-theme-negative/10 border border-theme-negative/20">
                  <div className="flex items-center gap-1.5 text-theme-negative text-xs font-medium mb-1">
                    <Info className="w-3.5 h-3.5" />
                    Advance Required
                  </div>
                  <p className="text-[10px] text-theme-text-muted">
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

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { calculateExitScenario, ExitScenarioResult, isHandoverExit } from '@/components/roi/constructionProgress';
import { DocumentControls, Currency } from './DocumentControls';
import { CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { PropertyGrowthChart } from './PropertyGrowthChart';
import { Info } from 'lucide-react';
import { translate } from '@/contexts/LanguageContext';

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
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const rowClickedRef = useRef(false);

  const handleRowMouseDown = (gIdx: number) => {
    if (exportMode) return;
    rowClickedRef.current = true;
    setIsDragging(true);
    dragStartRef.current = gIdx;
    dragMovedRef.current = false;
  };

  const handleRowMouseEnter = (gIdx: number) => {
    if (!isDragging || dragStartRef.current === null) return;
    if (gIdx !== dragStartRef.current) dragMovedRef.current = true;
    const start = Math.min(dragStartRef.current, gIdx);
    const end = Math.max(dragStartRef.current, gIdx);
    const range = new Set<number>();
    for (let i = start; i <= end; i++) range.add(i);
    setSelectedPayments(range);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && !dragMovedRef.current && dragStartRef.current !== null) {
        const idx = dragStartRef.current;
        setSelectedPayments(prev => {
          const next = new Set(prev);
          next.has(idx) ? next.delete(idx) : next.add(idx);
          return next;
        });
      }
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  // Click outside payment rows → clear selection
  useEffect(() => {
    const handleClickOutside = () => {
      if (rowClickedRef.current) { rowClickedRef.current = false; return; }
      if (selectedPayments.size > 0) setSelectedPayments(new Set());
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPayments.size]);

  const lang = (language === 'es' ? 'es' : 'en') as 'en' | 'es';
  const t = (key: string) => translate(key, lang);

  const { basePrice, totalMonths, yearlyProjections, holdAnalysis, totalEntryCosts } = calculations;
  const dldFee = basePrice * 0.04;
  const showCurrencyCol = currency !== 'AED';

  // Currency conversion helper
  const cv = (aed: number) => currency === 'AED' ? aed : aed * rate;
  const cvf = (aed: number) => n2s(cv(aed));
  const csym = CURRENCY_CONFIG[currency]?.symbol || currency;
  const cFlag = CURRENCY_CONFIG[currency]?.flag || '';

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
    if (months === totalMonths - 1) return t('docPreHandover');
    if (isHandoverExit(months, totalMonths)) return t('docHandoverExit');
    if (months < totalMonths) return `${months} mo`;
    const yearsAfter = Math.round((months - totalMonths) / 12);
    if (yearsAfter > 0) return `${t('docYrPrefix')} ${yearsAfter} ${t('docHoldSuffix')}`;
    return `+${months - totalMonths}m`;
  };

  // Payment plan rows for Section B
  const resellThreshold = (inputs as any).resellEligiblePercent ?? 30;

  // Helper to format date
  const formatShortDate = (d: Date) => {
    const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const m = (lang === 'es' ? monthsES : monthsEN)[d.getMonth()];
    return `${m} ${d.getFullYear()}`;
  };

  // Compute payment date string from milestone (includes construction % inline)
  const getPaymentDateStr = (m: { type: string; triggerValue: number }) => {
    const bookDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const hoDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);

    if (m.type === 'time') {
      const d = new Date(bookDate);
      d.setMonth(d.getMonth() + m.triggerValue);
      return formatShortDate(d);
    }
    if (m.type === 'construction') {
      const totalMs = hoDate.getTime() - bookDate.getTime();
      const d = new Date(bookDate.getTime() + totalMs * (m.triggerValue / 100));
      return `~${formatShortDate(d)} (${m.triggerValue}%)`;
    }
    if (m.type === 'post-handover') {
      const d = new Date(hoDate);
      d.setMonth(d.getMonth() + m.triggerValue);
      return `${formatShortDate(d)} ${t('docPostHO')}`;
    }
    return undefined;
  };

  // Section B: installments + completion only (downpayment is in Section A)
  const paymentRows = useMemo(() => {
    const rows: {
      label: string;
      percent: number;
      amount: number;
      cumulative: number;
      isHandover?: boolean;
      isPostHandover?: boolean;
      badges: string[];
      dateStr?: string;
    }[] = [];
    let cum = inputs.downpaymentPercent;
    let resellShown = cum >= resellThreshold;

    // 1) Pre-handover installments (exclude any marked as completion)
    const preHandover = inputs.additionalPayments.filter(m => !m.isHandover);
    const handoverInstallment = inputs.additionalPayments.find(m => m.isHandover);
    let idx = 0;

    preHandover.forEach((m) => {
      if (m.paymentPercent <= 0) return;
      cum += m.paymentPercent;
      idx++;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push(t('docResaleBadge')); resellShown = true; }
      rows.push({
        label: `${idx}${lang === 'es' ? 'ª' : ordSuffix(idx)} ${t('docInstallment')}`,
        percent: m.paymentPercent,
        amount: basePrice * m.paymentPercent / 100,
        cumulative: cum,
        badges,
        dateStr: getPaymentDateStr(m),
      });
    });

    // 2) Completion / Handover row — 3-tier priority
    let completionPercent: number;
    if (handoverInstallment) {
      completionPercent = handoverInstallment.paymentPercent;
    } else if ((inputs as any).hasPostHandoverPlan && (inputs as any).onHandoverPercent > 0) {
      completionPercent = (inputs as any).onHandoverPercent;
    } else {
      completionPercent = 100 - cum;
    }
    if (completionPercent > 0.5) {
      cum += completionPercent;
      const badges: string[] = [];
      if (!resellShown && cum >= resellThreshold) { badges.push(t('docResaleBadge')); resellShown = true; }
      const hoDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
      rows.push({
        label: t('docCompletionPayment'),
        percent: Math.round(completionPercent * 10) / 10,
        amount: basePrice * completionPercent / 100,
        cumulative: cum,
        isHandover: true,
        badges,
        dateStr: handoverInstallment
          ? getPaymentDateStr(handoverInstallment)
          : `${formatShortDate(hoDate)} ${t('docHandoverSuffix')}`,
      });
    }

    // 3) Post-handover installments
    const postPayments = (inputs as any).postHandoverPayments as typeof inputs.additionalPayments | undefined;
    if ((inputs as any).hasPostHandoverPlan && postPayments?.length) {
      let postIdx = 0;
      postPayments.forEach((m) => {
        if (m.paymentPercent <= 0) return;
        cum += m.paymentPercent;
        postIdx++;
        const badges: string[] = [];
        if (!resellShown && cum >= resellThreshold) { badges.push(t('docResaleBadge')); resellShown = true; }
        rows.push({
          label: `${postIdx}${lang === 'es' ? 'ª' : ordSuffix(postIdx)} ${t('docPostHO')} ${t('docInstallment')}`,
          percent: m.paymentPercent,
          amount: basePrice * m.paymentPercent / 100,
          cumulative: cum,
          isPostHandover: true,
          badges,
          dateStr: getPaymentDateStr(m),
        });
      });
    }

    return rows;
  }, [inputs, basePrice, resellThreshold, lang]);

  // Selected payments sum
  const selectedSum = useMemo(() => {
    if (selectedPayments.size === 0) return 0;
    return paymentRows
      .filter((_, i) => selectedPayments.has(i))
      .reduce((s, r) => s + r.amount, 0);
  }, [selectedPayments, paymentRows]);

  // Rental calculations
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const unitSqf = clientInfo?.unitSize || inputs.unitSizeSqf || 0;
  const annualServiceCharges = unitSqf * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const grossYield = inputs.rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // Snapshot calculations (paymentRows no longer has downpayment — it's all installments + completion)
  const additionalDeposits = paymentRows
    .filter(r => !r.isHandover && !r.isPostHandover)
    .reduce((sum, r) => sum + r.amount, 0);
  const handoverPayment = paymentRows.find(r => r.isHandover)?.amount || 0;
  const totalEquityRequired = basePrice + totalEntryCosts;

  // Mortgage
  const netMonthlyRent = netAnnualRent / 12;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden text-[11px] text-gray-900 mx-auto ${
      exportMode ? 'max-w-none' : 'max-w-[1120px]'
    }`}>
      {/* ============ LOGO + ADVISOR + TITLE + CONTROLS BAR ============ */}
      <div className="px-4 pt-4 flex items-center gap-4">
        {/* Logo */}
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
              <span className="text-[10px] text-theme-text-muted">{t('docAddCompanyLogo')}</span>
            </a>
          )}
        </div>
        {/* Advisor */}
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
        {/* Title */}
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-wide font-display uppercase leading-tight">
            {t('defaultSnapshotTitle')}
          </h1>
          <p className="text-xs text-gray-500 font-display">
            {clientInfo?.projectName || t('docSubtitleFallback')}
          </p>
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Controls */}
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

      {/* ============ HEADER ROW 1: Client & Unit Info (full width) ============ */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
          <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 8h1m-1 4h1m4-4h1m-1 4h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" /></svg>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('docClientUnitInfo')}</span>
        </div>
        <div className="border border-t-0 border-gray-200 rounded-b-md px-3 py-2">
          <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-[10.5px]">
            {(clientInfo?.developer || clientInfo?.projectName) && (
              <div>
                <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docPropertyLabel')}</span>
                <p className="text-gray-900 font-medium whitespace-nowrap">{[clientInfo?.developer, clientInfo?.projectName].filter(Boolean).join(' \u2013 ')}</p>
              </div>
            )}
            {(clientInfo?.clientName || clientInfo?.clientCountry) && (
              <div>
                <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docClientLabel')}</span>
                <p className="text-gray-900 font-medium whitespace-nowrap">{[clientInfo?.clientName, clientInfo?.clientCountry].filter(Boolean).join(' \u2013 ')}</p>
              </div>
            )}
            <div>
              <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docUnitLabel')}</span>
              <p className="text-gray-900 font-medium whitespace-nowrap">
                {[
                  clientInfo?.unitType,
                  inputs.unitSizeSqf ? `${n2s(inputs.unitSizeSqf)} sqft / ${(inputs.unitSizeSqf * 0.092903).toFixed(1)} m²` : null,
                ].filter(Boolean).join(' \u2013 ')}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docPriceLabel')}</span>
              <p className="text-gray-900 font-mono font-semibold whitespace-nowrap">
                AED {n2s(basePrice)}{showCurrencyCol && <span className="text-gray-400 font-normal ml-1">({csym} {cvf(basePrice)})</span>}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docHandoverLabel')}</span>
              <p className="text-gray-900 font-medium whitespace-nowrap">
                {new Date(inputs.handoverYear, inputs.handoverMonth - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                {' '}({totalMonths}mo)
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-[9px] uppercase tracking-wide">{t('docDownpaymentLabel')}</span>
              <p className="text-gray-900 font-mono font-medium whitespace-nowrap">{inputs.downpaymentPercent}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ HEADER ROW 2: Snapshot + Projected ROI (2 columns) ============ */}
      <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-200">
        {/* Snapshot */}
        <div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
            <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('docSnapshot')}</span>
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-3">
            <table className="w-full text-[9.5px]">
              <tbody>
                <tr>
                  <td className="py-[3px] text-gray-500 whitespace-nowrap">{t('docPaymentOnSPA')}</td>
                  <td className="py-[3px] text-right font-mono font-medium text-gray-900 whitespace-nowrap">{n2s(basePrice * inputs.downpaymentPercent / 100)} AED{showCurrencyCol && <span className="text-gray-400 ml-1">({csym} {cvf(basePrice * inputs.downpaymentPercent / 100)})</span>}</td>
                </tr>
                <tr>
                  <td className="py-[3px] text-gray-500 whitespace-nowrap">{t('docAdditionalDeposits')}</td>
                  <td className="py-[3px] text-right font-mono font-medium text-gray-900 whitespace-nowrap">{n2s(additionalDeposits)} AED{showCurrencyCol && <span className="text-gray-400 ml-1">({csym} {cvf(additionalDeposits)})</span>}</td>
                </tr>
                <tr>
                  <td className="py-[3px] text-gray-500 whitespace-nowrap">{t('docPaymentOnHandover')}</td>
                  <td className="py-[3px] text-right font-mono font-medium text-gray-900 whitespace-nowrap">{n2s(handoverPayment)} AED{showCurrencyCol && <span className="text-gray-400 ml-1">({csym} {cvf(handoverPayment)})</span>}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="py-[3px] font-bold text-gray-900 whitespace-nowrap">{t('docTotalEquityRequired')}</td>
                  <td className="py-[3px] text-right font-mono font-bold text-gray-900 whitespace-nowrap">{n2s(totalEquityRequired)} AED{showCurrencyCol && <span className="text-gray-400/60 ml-1">({csym} {cvf(totalEquityRequired)})</span>}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Projected ROI */}
        <div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B3893A] rounded-t-md">
            <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('docProjectedROI')}</span>
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md overflow-hidden">
            {exitResults.length === 0 && (
              <div className="p-4 text-center text-[10px] text-gray-400">
                {t('docNoExits')}
              </div>
            )}
            {exitResults.length > 0 && (
              <table className="w-full text-[9.5px]">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-left whitespace-nowrap">{t('docExitHeader')}</th>
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-right whitespace-nowrap">{t('docROEHeader')}</th>
                    <th className="py-1.5 px-3 text-[9px] font-semibold text-white uppercase tracking-wide text-right whitespace-nowrap">{t('docSalePriceHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {exitResults.slice(0, 3).map((sc, i) => {
                    const d = getDisplay(sc);
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-1.5 px-3 text-gray-700 font-medium whitespace-nowrap">{getExitLabel(scenarioMonths[i])}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                            {d.totalROE.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-gray-900 whitespace-nowrap">AED {n2s(sc.exitPrice)}{showCurrencyCol && <span className="text-gray-400 ml-1">({csym} {cvf(sc.exitPrice)})</span>}</td>
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
      <div className="space-y-5 py-5">

        {/* ============ SECTION A: Initial Cost ============ */}
        <div>
          <SectionHeader letter="A" title={t('docSectionATitle')} />
          <div className="px-4">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className={TH_CLS + ' text-left'}>{t('docDescriptionHeader')}</th>
                    <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>🇦🇪 AED</th>
                    {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { num: 'A1', label: t('docHoldingFee'), desc: t('docHoldingDesc'), value: inputs.eoiFee, key: 'a-eoi' },
                    { num: 'A2', label: t('docSPA'), desc: `${inputs.downpaymentPercent}% ${t('docOfPrice')}`, value: basePrice * inputs.downpaymentPercent / 100, key: 'a-spa' },
                    { num: 'A3', label: t('docDLDFee'), desc: `4% ${t('docOfPrice')}`, value: dldFee, key: 'a-dld' },
                    { num: 'A4', label: t('docOqoodFee'), desc: t('docAdminDesc'), value: inputs.oqoodFee, key: 'a-oqood' },
                  ].map((row) => (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className={TD_CLS}>
                        <span className="text-gray-400 font-mono text-[10px] mr-1.5">{row.num}.</span>
                        <span className="text-gray-900 font-medium">{row.label}</span>
                        <span className="text-gray-400 ml-2 text-[10px]">{row.desc}</span>
                      </td>
                      <td className={TD_CLS + ' text-right font-mono text-gray-900'}>{n2s(row.value)}</td>
                      {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-gray-900'}>{cvf(row.value)}</td>}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>{t('docCashToStart')}</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-gray-900'}>
                      {n2s(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}
                    </td>
                    {showCurrencyCol && (
                      <td className={TD_CLS + ' text-right font-mono font-bold text-gray-900'}>
                        {cvf(basePrice * inputs.downpaymentPercent / 100 + totalEntryCosts)}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ SECTION B: Milestone Event ============ */}
        <div>
          <SectionHeader letter="B" title={t('docSectionBTitle')} />
          <div className="px-4">
            {(() => {
              // Continuous flow: chain all payments, split by row count only
              const colCount = paymentRows.length <= 12 ? 1 : 2;
              const isMultiCol = colCount > 1;
              const thCls = isMultiCol ? 'py-1.5 px-2 text-[8px] font-semibold text-white uppercase tracking-wide whitespace-nowrap' : TH_CLS;
              const tdCls = isMultiCol ? 'py-1.5 px-2 text-[10px] whitespace-nowrap' : TD_CLS;

              // Split rows into columns
              const columns: typeof paymentRows[] = [];
              if (isMultiCol) {
                const perCol = Math.ceil(paymentRows.length / colCount);
                for (let c = 0; c < colCount; c++) {
                  columns.push(paymentRows.slice(c * perCol, (c + 1) * perCol));
                }
              }

              const renderTable = (rows: typeof paymentRows, startIdx: number, compact: boolean, includeTotal: boolean) => (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className={thCls + ' text-left'}>{t('docDescriptionHeader')}</th>
                      <th className={thCls + ' text-left'}>{t('docWhenHeader')}</th>
                      <th className={thCls + ' text-right w-[1%] whitespace-nowrap'}>%</th>
                      <th className={thCls + ' text-right w-[1%] whitespace-nowrap'}>🇦🇪 AED</th>
                      {showCurrencyCol && <th className={thCls + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const gIdx = startIdx + i;
                      const isSelected = selectedPayments.has(gIdx);
                      return (
                      <tr
                        key={gIdx}
                        onMouseDown={(e) => { e.preventDefault(); handleRowMouseDown(gIdx); }}
                        onMouseEnter={() => handleRowMouseEnter(gIdx)}
                        style={!exportMode ? { userSelect: 'none' } : undefined}
                        className={`border-t border-gray-100 transition-colors ${!exportMode ? 'cursor-pointer hover:bg-amber-50/60' : ''} ${
                          isSelected
                            ? 'bg-[#B3893A]/20 outline outline-2 outline-[#B3893A]/50 -outline-offset-2'
                            : row.isHandover ? 'bg-[#B3893A]/5' : row.isPostHandover ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <td className={tdCls}>
                          <span className={`font-medium ${row.isHandover ? 'text-[#8A6528]' : row.isPostHandover ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {row.label}
                          </span>
                          {row.badges.map((badge) => (
                            <span
                              key={badge}
                              className={`ml-1.5 inline-flex items-center text-[7px] px-1 rounded font-bold uppercase leading-none ${
                                badge === t('docResaleBadge')
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {badge}
                            </span>
                          ))}
                        </td>
                        <td className={tdCls + ' whitespace-nowrap'}>
                          {row.dateStr && (
                            <span className="text-gray-700 font-medium">{row.dateStr}</span>
                          )}
                        </td>
                        <td className={tdCls + ' text-right font-mono text-gray-600'}>{row.percent}%</td>
                        <td className={tdCls + ' text-right font-mono text-gray-900'}>{n2s(row.amount)}</td>
                        {showCurrencyCol && <td className={tdCls + ' text-right font-mono text-gray-500'}>{cvf(row.amount)}</td>}
                      </tr>
                      );
                    })}
                    {includeTotal && (
                      <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                        <td className={tdCls + ' font-bold text-[#8A6528]'}>{t('docTotalEquityRequired')}</td>
                        <td className={tdCls} />
                        <td className={tdCls} />
                        <td className={tdCls + ' text-right font-mono font-bold text-[#8A6528]'}>{n2s(totalEquityRequired)}</td>
                        {showCurrencyCol && <td className={tdCls + ' text-right font-mono font-bold text-[#8A6528]'}>{cvf(totalEquityRequired)}</td>}
                      </tr>
                    )}
                  </tbody>
                </table>
              );

              return (
                <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                  {isMultiCol ? (
                    <>
                      <div className={`grid ${colCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {columns.map((colRows, colIdx) => (
                          <div key={colIdx} className={colIdx > 0 ? 'border-l border-gray-200' : ''}>
                            {renderTable(
                              colRows,
                              colIdx * Math.ceil(paymentRows.length / colCount),
                              true,
                              false,
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Total row full-width for multi-col */}
                      <div className="border-t-2 border-gray-300 bg-[#B3893A]/5 flex items-center px-3 py-1.5">
                        <span className="text-[11px] font-bold text-[#8A6528] flex-1">{t('docTotalEquityRequired')}</span>
                        <span className="text-[11px] font-mono font-bold text-[#8A6528] whitespace-nowrap">
                          {n2s(totalEquityRequired)} AED
                          {showCurrencyCol && <span className="text-[#8A6528]/60 ml-2">({csym} {cvf(totalEquityRequired)})</span>}
                        </span>
                      </div>
                    </>
                  ) : (
                    renderTable(paymentRows, 0, false, true)
                  )}
                </div>
              );
            })()}
            {/* Floating selection summary — rendered at component root */}
          </div>
        </div>

        {/* ============ SECTION C: Projected Rental Income ============ */}
        <div>
          <SectionHeader letter="C" title={t('docSectionCTitle')} />
          <div className="px-4">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className={TH_CLS + ' text-left'}>{t('docLabelHeader')}</th>
                    <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docMonthly')} 🇦🇪</th>
                    <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docAnnual')} 🇦🇪</th>
                    {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docMonthly')} {cFlag}</th>}
                    {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docAnnual')} {cFlag}</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' text-gray-900 font-medium'}>{t('docGrossRentalIncome')}</td>
                    <td className={TD_CLS + ' text-right font-mono'}>{n2s(grossAnnualRent / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono'}>{n2s(grossAnnualRent)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono'}>{cvf(grossAnnualRent / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono'}>{cvf(grossAnnualRent)}</td>}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS}>
                      <span className="text-red-600 font-medium">{t('docServiceCharges')}</span>
                    </td>
                    <td className={TD_CLS + ' text-right font-mono text-red-600'}>{n2s(annualServiceCharges / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono text-red-600'}>{n2s(annualServiceCharges)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-red-600'}>{cvf(annualServiceCharges / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-red-600'}>{cvf(annualServiceCharges)}</td>}
                  </tr>
                  <tr className="border-t-2 border-gray-300 bg-[#B3893A]/5">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>{t('docNetRentalIncome')}</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{n2s(netAnnualRent / 12)}</td>
                    <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{n2s(netAnnualRent)}</td>
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{cvf(netAnnualRent / 12)}</td>}
                    {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono font-bold text-emerald-600'}>{cvf(netAnnualRent)}</td>}
                  </tr>
                  {/* Yield rows */}
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>{t('docGrossYield')}</td>
                    <td colSpan={showCurrencyCol ? 4 : 2} className={TD_CLS + ' text-right'}>
                      <span className="inline-flex items-center px-3 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                        {grossYield.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className={TD_CLS + ' font-bold text-gray-900'}>{t('docNetYield')}</td>
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
          <SectionHeader letter="D" title={t('docSectionDTitle')} />
          <div className="px-4">
            <div className="border border-gray-200 rounded-b-lg overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((yr) => (
                      <th key={yr} className={TH_CLS + ' text-center text-[9px]'}>{t('docYrPrefix')} {yr}</th>
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
                          {showCurrencyCol && value !== 0 && <div className="text-gray-400 text-[8px]">{n2sShort(cv(value))}</div>}
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
              language={language}
            />
          </div>
        </div>

        {/* ============ SECTION E: Exit Scenarios ============ */}
        {exitResults.length > 0 && (() => {
          const hasThresholdWarning = exitResults.some(sc => !sc.isThresholdMet);
          return (
            <div>
              <SectionHeader letter="E" title={t('docSectionETitle')} />
              <div className="px-4">
                <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-900">
                        <th className={TH_CLS + ' text-left'}>{t('docExitHeader')}</th>
                        <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docInvestedHeader')}</th>
                        {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                        <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docExitPriceHeader')}</th>
                        {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                        <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docNetProfitHeader')}</th>
                        {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                        <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{t('docROEHeader')}</th>
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
                            {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-gray-500'}>{cvf(sc.totalCapital)}</td>}
                            <td className={TD_CLS + ' text-right font-mono font-medium text-gray-900 whitespace-nowrap'}>{n2s(sc.exitPrice)}</td>
                            {showCurrencyCol && <td className={TD_CLS + ' text-right font-mono text-gray-500'}>{cvf(sc.exitPrice)}</td>}
                            <td className={`${TD_CLS} text-right font-mono font-semibold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {d.profit >= 0 ? '+' : ''}{n2s(Math.abs(d.profit))}
                            </td>
                            {showCurrencyCol && <td className={`${TD_CLS} text-right font-mono ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{cvf(Math.abs(d.profit))}</td>}
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
                      <span className="font-semibold">* {t('docBelowThreshold')} {inputs.minimumExitThreshold}% {t('docThresholdSuffix')}</span>
                      {' — '}{t('docThresholdNote')}
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
              title={t('docSectionFTitle')}
              subtitle={`${mortgageData.financingPercent}% + ${mortgageData.loanTermYears}yr + ${mortgageData.interestRate}%`}
            />
            <div className="px-4">
              <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className={TH_CLS + ' text-left'}>{t('docLabelHeader')}</th>
                      <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>🇦🇪 AED</th>
                      {showCurrencyCol && <th className={TH_CLS + ' text-right w-[1%] whitespace-nowrap'}>{cFlag} {csym}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const cashflow = netMonthlyRent - mortgageData.monthlyPayment;
                      const cashflowPositive = cashflow >= 0;
                      const rows = [
                        { label: t('docLoanAmount'), value: n2s(mortgageData.loanAmount), converted: cvf(mortgageData.loanAmount), cls: '' },
                        { label: t('docMonthlyPaymentIns'), value: n2s(mortgageData.monthlyPayment), converted: cvf(mortgageData.monthlyPayment), cls: '' },
                        { label: t('docNetMonthlyRent'), value: n2s(netMonthlyRent), converted: cvf(netMonthlyRent), cls: '' },
                        {
                          label: t('docMonthlyCashflow'),
                          value: `${cashflowPositive ? '+' : ''}${n2s(cashflow)}`,
                          converted: cvf(Math.abs(cashflow)),
                          cls: cashflowPositive ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-red-600 bg-red-50/50 font-bold',
                        },
                        {
                          label: t('docRentCoverage'),
                          value: `${mortgageData.monthlyPayment > 0 ? Math.round((netMonthlyRent / mortgageData.monthlyPayment) * 100) : 0}%`,
                          converted: null,
                          cls: netMonthlyRent >= mortgageData.monthlyPayment ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-red-600 bg-red-50/50 font-bold',
                        },
                      ];
                      return rows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 first:border-t-0">
                          <td className={TD_CLS + ' text-gray-700 font-medium'}>{row.label}</td>
                          <td className={`${TD_CLS} text-right font-mono ${row.cls || 'text-gray-900'}`}>{row.value}</td>
                          {showCurrencyCol && <td className={`${TD_CLS} text-right font-mono ${row.cls || 'text-gray-500'}`}>{row.converted || ''}</td>}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ SECTION G: Property Renders (conditional) ============ */}
        {((inputs as any)._buildingRenderUrl || (inputs as any)._floorplanUrl) && (
          <div>
            <SectionHeader letter="G" title={t('docSectionGTitle')} subtitle={t('docBuildingFloorPlan')} />
            <div className="px-4">
              <div className={`${(inputs as any)._buildingRenderUrl && (inputs as any)._floorplanUrl ? 'grid grid-cols-2 gap-4' : ''}`}>
                {(inputs as any)._buildingRenderUrl && (
                  <div>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{t('docBuildingRender')}</p>
                    <img
                      src={(inputs as any)._buildingRenderUrl}
                      alt="Building Render"
                      className="w-full max-h-[400px] object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {(inputs as any)._floorplanUrl && (
                  <div>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{t('docFloorPlan')}</p>
                    <img
                      src={(inputs as any)._floorplanUrl}
                      alt="Floor Plan"
                      className="w-full max-h-[400px] object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
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
                {t('docExitHeader')} {scenarioMonths[exitDetailModal]}m — {t('docExitFullAnalysis')}
              </h3>
              <button onClick={() => setExitDetailModal(null)} className="text-white/70 hover:text-white text-lg font-bold">&times;</button>
            </div>
            <div className="p-5 space-y-1.5 text-xs max-h-[60vh] overflow-y-auto">
              {(() => {
                const sc = exitResults[exitDetailModal];
                const d = getDisplay(sc);
                const rows = [
                  { label: t('docExitPriceLabel'), value: `${csym} ${cvf(sc.exitPrice)}` },
                  { label: t('docAppreciationHeader'), value: `${csym} ${cvf(sc.appreciation)} (${sc.appreciationPercent.toFixed(1)}%)` },
                  { label: t('equityDeployedLabel'), value: `${csym} ${cvf(sc.equityDeployed)} (${sc.equityPercent.toFixed(0)}%)` },
                  { label: t('docEntryCosts'), value: `${csym} ${cvf(sc.entryCosts)}` },
                  ...(sc.exitCosts > 0 ? [
                    { label: t('docAgentCommission'), value: `${csym} ${cvf(sc.agentCommission)}` },
                    { label: t('docNOCFee'), value: `${csym} ${cvf(sc.nocFee)}` },
                  ] : []),
                  { label: t('totalCapitalLabel'), value: `${csym} ${cvf(sc.totalCapital)}`, accent: true },
                  { label: t('netProfitLabel'), value: `${d.profit >= 0 ? '+' : ''}${csym} ${cvf(d.profit)}`, positive: d.profit >= 0, negative: d.profit < 0 },
                  { label: t('docTotalROE'), value: `${d.totalROE.toFixed(1)}%`, accent: true },
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
                    {t('docAdvanceRequired')}
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {t('docThresholdNotReached')} {inputs.minimumExitThreshold}% {t('docThresholdSuffix')}.
                    {t('docAdvanceOf')} {csym} {cvf(exitResults[exitDetailModal].advanceRequired)} {t('docNeeded')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating selection summary bar */}
      {selectedPayments.size > 0 && !exportMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#B3893A]/50 shadow-lg shadow-black/10 text-[12px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-[#8A6528] font-bold">
            {selectedPayments.size} {t('docSelected')}
          </span>
          <span className="w-px h-4 bg-[#B3893A]/30" />
          <span className="font-mono font-bold text-gray-900">
            AED {n2s(selectedSum)}
          </span>
          {showCurrencyCol && (
            <>
              <span className="w-px h-4 bg-[#B3893A]/30" />
              <span className="font-mono font-bold text-[#8A6528]/70">
                {csym} {cvf(selectedSum)}
              </span>
            </>
          )}
          <button
            onClick={() => setSelectedPayments(new Set())}
            className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors text-sm leading-none"
          >
            &times;
          </button>
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
const TH_CLS = 'py-1.5 px-2 text-[9px] font-semibold text-white uppercase tracking-wide whitespace-nowrap';
const TD_CLS = 'py-1.5 px-2 text-[11px] whitespace-nowrap';

// ─── Section header: gold bar with white text and circled letter badge ──
const SectionHeader: React.FC<{ letter: string; title: string; subtitle?: string }> = ({ letter, title, subtitle }) => (
  <div className="mx-4 flex items-center gap-3 px-3 py-2 bg-[#B3893A] rounded-t-lg">
    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{letter}</span>
    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{title}</span>
    {subtitle && (
      <span className="ml-auto text-[10px] text-white/80 font-mono">{subtitle}</span>
    )}
  </div>
);

import { useState } from 'react';
import { CreditCard, HardHat, Key, Clock, ChevronDown, ArrowRight } from 'lucide-react';
import { OIInputs, monthName } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface InvestmentRoadmapProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  totalMonths: number;
  onViewPayments?: () => void;
}

export const InvestmentRoadmap = ({
  inputs,
  currency,
  rate,
  totalMonths,
  onViewPayments,
}: InvestmentRoadmapProps) => {
  const { language, t } = useLanguage();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const {
    basePrice,
    downpaymentPercent,
    additionalPayments = [],
    bookingMonth,
    bookingYear,
    handoverMonth,
    handoverYear,
    oqoodFee,
    eoiFee = 0,
    hasPostHandoverPlan,
    onHandoverPercent = 0,
    postHandoverPayments = [],
    postHandoverEndMonth,
    postHandoverEndYear,
    preHandoverPercent,
  } = inputs;

  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;

  // Journey (pre-handover installments)
  const sortedPayments = [...additionalPayments].sort((a, b) => a.triggerValue - b.triggerValue);

  // Filter pre-handover payments for post-handover plans
  const preHandoverPayments = hasPostHandoverPlan && postHandoverPayments?.length > 0
    ? sortedPayments
    : sortedPayments;

  const journeyTotal = preHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );
  const journeyPercent = preHandoverPayments.reduce(
    (sum, p) => sum + p.paymentPercent, 0
  );

  // Handover
  let handoverPercent: number;
  let handoverAmount: number;
  if (hasPostHandoverPlan) {
    const totalAdditionalPercent = sortedPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
    const totalAllocatedPercent = downpaymentPercent + totalAdditionalPercent;
    if (Math.abs(totalAllocatedPercent - 100) < 0.5) {
      handoverPercent = 0;
      handoverAmount = 0;
    } else {
      handoverPercent = onHandoverPercent;
      handoverAmount = basePrice * handoverPercent / 100;
    }
  } else {
    handoverPercent = 100 - preHandoverPercent;
    handoverAmount = basePrice * handoverPercent / 100;
  }

  // Post-handover
  const derivedPostHandoverPayments = hasPostHandoverPlan
    ? (postHandoverPayments?.length > 0
        ? [...postHandoverPayments].sort((a, b) => a.triggerValue - b.triggerValue)
        : [])
    : [];
  const postHandoverTotal = derivedPostHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );
  const postHandoverPercent = derivedPostHandoverPayments.reduce(
    (sum, p) => sum + p.paymentPercent, 0
  );

  // Progress percentage (cumulative)
  const entryProgress = downpaymentPercent;
  const journeyProgress = downpaymentPercent + journeyPercent;
  const handoverProgress = journeyProgress + handoverPercent;

  // Format helpers
  const getDual = (value: number) => formatDualCurrency(value, currency, rate);
  const bookingDate = `${monthName(bookingMonth)} ${bookingYear}`;
  const handoverDate = `${monthName(handoverMonth)} ${handoverYear}`;

  const togglePhase = (phase: string) => {
    setExpandedPhase(prev => prev === phase ? null : phase);
  };

  const phases = [
    {
      id: 'entry',
      icon: CreditCard,
      label: language === 'es' ? 'Entrada' : 'Entry',
      color: 'text-theme-accent',
      bgColor: 'bg-theme-accent/10',
      borderColor: 'border-theme-accent/30',
      progressColor: 'bg-theme-accent',
      date: bookingDate,
      percent: downpaymentPercent,
      amount: entryTotal,
      progress: entryProgress,
      detail: `${downpaymentPercent}% + DLD + Oqood`,
      expandable: true,
      expandContent: (
        <div className="space-y-1.5 pt-2 pl-8">
          {eoiFee > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">{t('eoiBookingLabel')}</span>
              <span className="font-mono text-theme-text">{getDual(eoiFee).primary}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-theme-text-muted">
              {eoiFee > 0 ? (language === 'es' ? 'Saldo Downpayment' : 'Downpayment Balance') : `Downpayment (${downpaymentPercent}%)`}
            </span>
            <span className="font-mono text-theme-text">{getDual(eoiFee > 0 ? downpaymentAmount - eoiFee : downpaymentAmount).primary}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-theme-text-muted">DLD (4%)</span>
            <span className="font-mono text-theme-text">{getDual(dldFee).primary}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-theme-text-muted">Oqood</span>
            <span className="font-mono text-theme-text">{getDual(oqoodFee).primary}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'construction',
      icon: HardHat,
      label: language === 'es' ? 'Construccion' : 'Construction',
      color: 'text-theme-accent',
      bgColor: 'bg-theme-accent/10',
      borderColor: 'border-theme-accent/30',
      progressColor: 'bg-theme-accent',
      date: `${totalMonths} ${language === 'es' ? 'meses' : 'months'}`,
      percent: journeyPercent,
      amount: journeyTotal,
      progress: journeyProgress,
      detail: `${preHandoverPayments.length} ${language === 'es' ? 'cuotas' : 'installments'}`,
      expandable: false,
    },
    {
      id: 'handover',
      icon: Key,
      label: language === 'es' ? 'Entrega' : 'Handover',
      color: 'text-theme-positive',
      bgColor: 'bg-theme-positive/10',
      borderColor: 'border-theme-positive/30',
      progressColor: 'bg-theme-positive',
      date: handoverDate,
      percent: handoverPercent,
      amount: handoverAmount,
      progress: handoverProgress,
      detail: null,
      expandable: false,
    },
  ];

  // Add post-handover phase if applicable
  if (hasPostHandoverPlan && derivedPostHandoverPayments.length > 0) {
    const phEndDate = postHandoverEndMonth && postHandoverEndYear
      ? `${monthName(postHandoverEndMonth)} ${postHandoverEndYear}`
      : `+${derivedPostHandoverPayments.length * 3} ${language === 'es' ? 'meses' : 'months'}`;

    phases.push({
      id: 'posthandover',
      icon: Clock,
      label: language === 'es' ? 'Post-Entrega' : 'Post-Handover',
      color: 'text-theme-text-muted',
      bgColor: 'bg-theme-bg',
      borderColor: 'border-theme-border',
      progressColor: 'bg-theme-accent',
      date: phEndDate,
      percent: postHandoverPercent,
      amount: postHandoverTotal,
      progress: 100,
      detail: `${derivedPostHandoverPayments.length} ${language === 'es' ? 'cuotas' : 'installments'}`,
      expandable: false,
    });
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-theme-text mb-4">
        {language === 'es' ? 'Hoja de Ruta de Inversion' : 'Investment Roadmap'}
      </h3>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-theme-border" />

        <div className="space-y-3">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isExpanded = expandedPhase === phase.id;

            return (
              <Collapsible
                key={phase.id}
                open={isExpanded}
                onOpenChange={() => phase.expandable && togglePhase(phase.id)}
              >
                <div className="relative">
                  {/* Phase circle on the timeline */}
                  <div className={cn(
                    "absolute left-0 top-3 w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 border-2",
                    phase.bgColor,
                    phase.borderColor,
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", phase.color)} />
                  </div>

                  {/* Phase content */}
                  <div className="ml-10">
                    <CollapsibleTrigger
                      className={cn(
                        "w-full text-left rounded-lg p-3 transition-colors",
                        phase.expandable ? "hover:bg-theme-card-alt cursor-pointer" : "cursor-default",
                      )}
                      disabled={!phase.expandable}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-theme-text">
                            {language === 'es' ? 'Fase' : 'Phase'} {index + 1}: {phase.label}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            phase.bgColor, phase.color,
                          )}>
                            {phase.percent > 0 ? `${phase.percent.toFixed(0)}%` : ''}
                          </span>
                          {phase.expandable && (
                            <ChevronDown className={cn(
                              "w-3 h-3 text-theme-text-muted transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          )}
                        </div>
                        <span className="text-sm font-bold font-mono text-theme-text">
                          {getDual(phase.amount).primary}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-theme-text-muted">{phase.date}</span>
                        {phase.detail && (
                          <>
                            <span className="text-[10px] text-theme-text-muted/50">·</span>
                            <span className="text-[10px] text-theme-text-muted">{phase.detail}</span>
                          </>
                        )}
                        {getDual(phase.amount).secondary && currency !== 'AED' && (
                          <>
                            <span className="text-[10px] text-theme-text-muted/50">·</span>
                            <span className="text-[10px] text-theme-text-muted">{getDual(phase.amount).secondary}</span>
                          </>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-theme-border/30 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", phase.progressColor)}
                          style={{ width: `${Math.min(100, phase.progress)}%` }}
                        />
                      </div>
                    </CollapsibleTrigger>

                    {/* Expandable detail */}
                    {phase.expandable && (
                      <CollapsibleContent className="px-3 pb-2">
                        {phase.expandContent}
                      </CollapsibleContent>
                    )}
                  </div>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* View Payment Plan button */}
      {onViewPayments && (
        <button
          onClick={onViewPayments}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-theme-accent hover:bg-theme-accent/5 rounded-lg transition-colors border border-theme-border"
        >
          {language === 'es' ? 'Ver Plan de Pagos' : 'View Payment Plan'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

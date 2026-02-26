import React from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
interface Props {
  inputs: OIInputs;
  onSave: () => void;
  isSaving?: boolean;
}

export const ReviewStep: React.FC<Props> = ({ inputs }) => {
  const formatAED = (v: number) => {
    return new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(v);
  };

  const totalMonths = (() => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const dldFee = inputs.basePrice * 0.04;
  const totalEntryCosts = dldFee + inputs.oqoodFee;
  const exitScenarios = inputs._exitScenarios || [];
  const constructionRate = inputs.constructionAppreciation ?? 12;
  const postConstructionRate = inputs.postConstructionAppreciation ?? 6;

  const rows = [
    { label: 'Base Price', value: `AED ${formatAED(inputs.basePrice)}` },
    { label: 'Construction', value: `${totalMonths} months` },
    { label: 'Downpayment', value: `${inputs.downpaymentPercent}%` },
    { label: 'Payment Split', value: `${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}` },
    { label: 'DLD Fee (4%)', value: `AED ${formatAED(dldFee)}` },
    { label: 'Oqood Fee', value: `AED ${formatAED(inputs.oqoodFee)}` },
    { label: 'Total Entry Costs', value: `AED ${formatAED(totalEntryCosts)}`, highlight: true },
    { label: 'Construction Appreciation', value: `${constructionRate}%` },
    { label: 'Post-Construction Appreciation', value: `${postConstructionRate}%` },
    { label: 'Rental Yield', value: `${inputs.rentalYieldPercent}%` },
    { label: 'Rent Growth', value: `${inputs.rentGrowthRate}% / year` },
    { label: 'Service Charges', value: `AED ${inputs.serviceChargePerSqft}/sqft` },
    { label: 'Exit Scenarios', value: exitScenarios.length > 0 ? exitScenarios.map(m => `${m}m`).join(', ') : 'None selected' },
    { label: 'Exit Commission', value: inputs.exitAgentCommissionEnabled ? '2%' : 'Off' },
    { label: 'NOC Fee', value: `AED ${formatAED(inputs.exitNocFee)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-theme-text mb-1">Strategy Summary</h3>
        <p className="text-xs text-theme-text-muted">
          Review your inputs. The cashflow document updates live.
        </p>
      </div>

      {/* Summary table */}
      <div className="rounded-xl border border-theme-border overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-2.5 text-sm ${
              i % 2 === 0 ? 'bg-theme-card' : 'bg-theme-card-alt'
            } ${row.highlight ? 'border-t border-b border-theme-accent/20' : ''}`}
          >
            <span className={`${row.highlight ? 'text-theme-accent font-medium' : 'text-theme-text-muted'}`}>
              {row.label}
            </span>
            <span className={`font-mono ${row.highlight ? 'text-theme-accent font-semibold' : 'text-theme-text'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

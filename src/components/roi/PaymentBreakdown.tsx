import { OIInputs, PaymentMilestone } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Calendar, CreditCard, Home, Clock, Building2 } from "lucide-react";

interface PaymentBreakdownProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
}

// Convert quarter to readable date string
const quarterToDateString = (quarter: number, year: number): string => {
  const monthNames: Record<number, string> = {
    1: 'Feb',
    2: 'May',
    3: 'Aug',
    4: 'Nov'
  };
  return `${monthNames[quarter]} ${year}`;
};

// Estimate date from months after booking
const estimateDateFromMonths = (months: number, bookingQuarter: number, bookingYear: number): string => {
  const baseMonth = (bookingQuarter - 1) * 3 + 2; // Q1→2, Q2→5, etc.
  const totalMonths = baseMonth + months;
  const yearOffset = Math.floor(totalMonths / 12);
  const month = totalMonths % 12 || 12;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

// Estimate date from construction percentage
const estimateDateFromConstruction = (percent: number, totalMonths: number, bookingQuarter: number, bookingYear: number): string => {
  const months = Math.round((percent / 100) * totalMonths);
  return estimateDateFromMonths(months, bookingQuarter, bookingYear);
};

export const PaymentBreakdown = ({ inputs, currency, totalMonths }: PaymentBreakdownProps) => {
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, dldFeePercent, oqoodFee, bookingQuarter, bookingYear, handoverQuarter, handoverYear } = inputs;

  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * dldFeePercent / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  
  // Sort additional payments by trigger
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    // Time-based come before construction-based at same effective time
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    // Convert to comparable time
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  // Calculate totals
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  const totalPropertyPayments = basePrice;
  const totalEntryCosts = dldFeeAmount + oqoodFee;
  const grandTotal = totalPropertyPayments + totalEntryCosts;
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142] flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#CCFF00]" />
        <div>
          <h3 className="font-semibold text-white">Payment Breakdown</h3>
          <p className="text-xs text-gray-400">Complete schedule of all payments</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center pb-3 border-b border-[#2a3142]">
          <span className="text-sm text-gray-400">Base Property Price</span>
          <span className="text-lg font-bold text-white font-mono">{formatCurrency(basePrice, currency)}</span>
        </div>

        {/* Section: At Booking */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">AT BOOKING ({quarterToDateString(bookingQuarter, bookingYear)})</span>
          </div>
          
          <div className="pl-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Downpayment ({downpaymentPercent}%)</span>
              <span className="text-sm text-white font-mono">{formatCurrency(downpaymentAmount, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">DLD Fee ({dldFeePercent}%)</span>
              <span className="text-sm text-white font-mono">{formatCurrency(dldFeeAmount, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Oqood Fee</span>
              <span className="text-sm text-white font-mono">{formatCurrency(oqoodFee, currency)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]/50">
              <span className="text-sm font-medium text-[#CCFF00]">Total Today</span>
              <span className="text-sm font-bold text-[#CCFF00] font-mono">{formatCurrency(todayTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Section: During Construction */}
        {sortedAdditionalPayments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">DURING CONSTRUCTION</span>
            </div>
            
            <div className="pl-6 space-y-2">
              {sortedAdditionalPayments.map((payment, index) => {
                const amount = basePrice * payment.paymentPercent / 100;
                const dateStr = payment.type === 'time' 
                  ? estimateDateFromMonths(payment.triggerValue, bookingQuarter, bookingYear)
                  : estimateDateFromConstruction(payment.triggerValue, totalMonths, bookingQuarter, bookingYear);
                const triggerLabel = payment.type === 'time'
                  ? `Month ${payment.triggerValue}`
                  : `${payment.triggerValue}% construction`;
                
                return (
                  <div key={payment.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {payment.type === 'time' ? (
                        <Clock className="w-3 h-3 text-gray-500" />
                      ) : (
                        <Building2 className="w-3 h-3 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-300">
                        {payment.paymentPercent}% @ {triggerLabel}
                      </span>
                      <span className="text-xs text-gray-500">({dateStr})</span>
                    </div>
                    <span className="text-sm text-white font-mono">{formatCurrency(amount, currency)}</span>
                  </div>
                );
              })}
              {additionalTotal > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]/50">
                  <span className="text-sm text-gray-400">Subtotal Installments</span>
                  <span className="text-sm text-gray-300 font-mono">{formatCurrency(additionalTotal, currency)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section: At Handover */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">AT HANDOVER ({quarterToDateString(handoverQuarter, handoverYear)})</span>
          </div>
          
          <div className="pl-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Final Payment ({handoverPercent}%)</span>
              <span className="text-sm text-white font-mono">{formatCurrency(handoverAmount, currency)}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="mt-4 pt-4 border-t border-[#2a3142] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Property Payments</span>
            <span className="text-sm text-white font-mono">{formatCurrency(totalPropertyPayments, currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Entry Costs (DLD + Oqood)</span>
            <span className="text-sm text-white font-mono">{formatCurrency(totalEntryCosts, currency)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#CCFF00]/30 bg-[#CCFF00]/5 -mx-4 px-4 py-2">
            <span className="text-sm font-bold text-[#CCFF00]">TOTAL TO DISBURSE</span>
            <span className="text-lg font-bold text-[#CCFF00] font-mono">{formatCurrency(grandTotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

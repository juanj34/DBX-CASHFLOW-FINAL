import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatDualCurrency } from '../currencyUtils';

interface ExportPaymentTableProps {
  inputs: OIInputs;
  clientInfo?: ClientUnitData;
  valueDifferentiators?: string[];
  appreciationBonus?: number;
  currency: Currency;
  rate: number;
  totalMonths: number;
  language: 'en' | 'es';
}

const monthToDateString = (month: number, year: number, language: string): string => {
  const monthNames = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${year}`;
};

const estimateDateFromMonths = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonths = bookingMonth + monthsFromBooking;
  const yearOffset = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  return monthToDateString(month, bookingYear + yearOffset, language);
};

export const ExportPaymentTable = ({
  inputs,
  valueDifferentiators = [],
  appreciationBonus = 0,
  currency,
  rate,
  totalMonths,
  language,
}: ExportPaymentTableProps) => {
  const { 
    basePrice, 
    downpaymentPercent, 
    preHandoverPercent, 
    additionalPayments, 
    bookingMonth, 
    bookingYear,
    handoverQuarter,
    handoverYear,
    oqoodFee,
    eoiFee = 0
  } = inputs;
  
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Helper to check if a payment is AFTER the handover quarter
  const isPaymentAfterHandoverQuarter = (monthsFromBooking: number): boolean => {
    const bookingDate = new Date(bookingYear, bookingMonth - 1);
    const paymentDate = new Date(bookingDate);
    paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
    
    const handoverQuarterEndMonth = handoverQuarter * 3;
    const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
    
    return paymentDate > handoverQuarterEnd;
  };
  
  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const remainingDownpayment = downpaymentAmount - eoiFee;
  const dldFee = basePrice * 0.04;
  
  let handoverPercent: number;
  let handoverAmount: number;
  let postHandoverTotal = 0;
  let postHandoverPaymentsToUse = inputs.postHandoverPayments || [];
  
  // Separate pre-handover and post-handover payments
  let preHandoverPayments = [...(additionalPayments || [])];
  
  // Calculate total percentage from all payments to detect 100% allocation
  const totalAdditionalPercent = (additionalPayments || []).reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = downpaymentPercent + totalAdditionalPercent;
  
  if (hasPostHandoverPlan) {
    // If no dedicated postHandoverPayments, derive from additionalPayments
    if (postHandoverPaymentsToUse.length === 0 && additionalPayments?.length > 0) {
      postHandoverPaymentsToUse = additionalPayments.filter(p => {
        if (p.type !== 'time') return false;
        return isPaymentAfterHandoverQuarter(p.triggerValue);
      });
      
      // Filter pre-handover payments (exclude post-handover ones)
      preHandoverPayments = additionalPayments.filter(p => {
        if (p.type !== 'time') return true; // construction-based stay in pre-handover
        return !isPaymentAfterHandoverQuarter(p.triggerValue);
      });
    }
    
    postHandoverTotal = postHandoverPaymentsToUse.reduce(
      (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
    );
    
    // Check if payments already sum to 100% - if so, handover is already included
    // and we should NOT add an extra onHandoverPercent
    if (Math.abs(totalAllocatedPercent - 100) < 0.5) {
      // All payments are in additionalPayments, no separate handover payment
      handoverPercent = 0;
      handoverAmount = 0;
    } else {
      // Use configured onHandoverPercent for explicit handover payment
      handoverPercent = inputs.onHandoverPercent || 0;
      handoverAmount = basePrice * handoverPercent / 100;
    }
  } else {
    handoverPercent = 100 - inputs.preHandoverPercent;
    handoverAmount = basePrice * handoverPercent / 100;
  }
  
  const entrySubtotal = downpaymentAmount;
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;
  
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  const sortedPayments = [...preHandoverPayments].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    return a.type === 'time' ? -1 : 1;
  });

  const journeyTotal = sortedPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );

  // Total Cash Until Handover = Entry + Journey + On Handover
  const totalUntilHandover = entryTotal + journeyTotal + handoverAmount;

  const grandTotal = hasPostHandoverPlan
    ? entryTotal + journeyTotal + handoverAmount + postHandoverTotal
    : entryTotal + journeyTotal + handoverAmount;

  const getPaymentLabel = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') return `${language === 'es' ? 'Mes' : 'Month'} ${payment.triggerValue}`;
    if (payment.type === 'construction') return `${payment.triggerValue}% ${language === 'es' ? 'Construido' : 'Built'}`;
    return payment.label || (language === 'es' ? 'Pago' : 'Payment');
  };
  
  const getPaymentDate = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') {
      return estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language);
    }
    if (payment.type === 'construction') {
      const monthsForPercent = Math.round((payment.triggerValue / 100) * totalMonths);
      return estimateDateFromMonths(monthsForPercent, bookingMonth, bookingYear, language);
    }
    return '';
  };

  const t = {
    paymentBreakdown: language === 'es' ? 'Desglose de Pagos' : 'Payment Breakdown',
    theEntry: language === 'es' ? 'La Entrada' : 'The Entry',
    theJourney: language === 'es' ? 'El Camino' : 'The Journey',
    handover: language === 'es' ? 'Entrega' : 'Handover',
    totalEntry: language === 'es' ? 'Total Entrada' : 'Total Entry',
    subtotal: language === 'es' ? 'Subtotal' : 'Subtotal',
    finalPayment: language === 'es' ? 'Pago Final' : 'Final Payment',
    basePropertyPrice: language === 'es' ? 'Precio Base' : 'Base Property Price',
    transactionFees: language === 'es' ? 'Impuestos y Tasas' : 'Transaction Fees (DLD + Oqood)',
    totalInvestment: language === 'es' ? 'Inversión Total' : 'Total Investment',
    valueAdds: language === 'es' ? 'Valor Agregado' : 'Value Adds',
    bonus: language === 'es' ? 'bono' : 'bonus',
    eoiBookingFee: language === 'es' ? 'EOI / Cuota de Reserva' : 'EOI / Booking Fee',
    downpaymentBalance: language === 'es' ? 'Saldo de Enganche' : 'Downpayment Balance',
    downpayment: language === 'es' ? 'Enganche' : 'Downpayment',
    dldFee: language === 'es' ? 'Tarifa DLD (4%)' : 'DLD Fee (4%)',
    oqoodAdmin: language === 'es' ? 'Oqood/Admin' : 'Oqood/Admin',
    handoverPayment: language === 'es' ? 'Pago en Entrega' : 'Handover Payment',
    postHandover: language === 'es' ? 'Post-Entrega' : 'Post-Handover',
    months: language === 'es' ? 'meses' : 'months',
    paidUntilHandover: language === 'es' ? 'Pagado Hasta Handover' : 'Paid Until Handover',
    paidPostHandover: language === 'es' ? 'Pagado Post-Handover' : 'Paid Post-Handover',
  };

  const sectionStyle = { marginBottom: '12px' };
  const sectionHeaderStyle = {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontWeight: 600,
    marginBottom: '8px',
  };
  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '12px',
  };
  const labelStyle = { color: 'hsl(var(--theme-text-muted))' };
  const valueStyle = { 
    fontFamily: 'monospace', 
    color: 'hsl(var(--theme-text))',
    fontFeatureSettings: '"tnum"' as const,
    textAlign: 'right' as const,
  };

  return (
    <div 
      style={{
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '12px',
          borderBottom: '1px solid hsl(var(--theme-border))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--theme-text))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t.paymentBreakdown}
        </span>
        <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>
          {monthToDateString(bookingMonth, bookingYear, language)} → Q{handoverQuarter} {handoverYear}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* The Entry */}
        <div style={sectionStyle}>
          <div style={{ ...sectionHeaderStyle, color: 'hsl(var(--theme-accent))' }}>{t.theEntry}</div>
          
          {eoiFee > 0 && (
            <div style={rowStyle}>
              <span style={labelStyle}>{t.eoiBookingFee}</span>
              <span style={valueStyle}>
                {getDualValue(eoiFee).primary}
                {getDualValue(eoiFee).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(eoiFee).secondary})</span>
                )}
              </span>
            </div>
          )}
          
          <div style={rowStyle}>
            <span style={labelStyle}>{eoiFee > 0 ? t.downpaymentBalance : `${t.downpayment} (${downpaymentPercent}%)`}</span>
            <span style={valueStyle}>
              {getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).primary}
              {getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).secondary})</span>
              )}
            </span>
          </div>
          
          {eoiFee > 0 && (
            <div style={{ ...rowStyle, borderTop: '1px dashed hsl(var(--theme-border))', marginTop: '4px', paddingTop: '8px' }}>
              <span style={{ ...labelStyle, fontSize: '11px' }}>{t.subtotal} ({downpaymentPercent}%)</span>
              <span style={{ ...valueStyle, fontSize: '11px' }}>
                {getDualValue(entrySubtotal).primary}
                {getDualValue(entrySubtotal).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(entrySubtotal).secondary})</span>
                )}
              </span>
            </div>
          )}
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.dldFee}</span>
            <span style={valueStyle}>
              {getDualValue(dldFee).primary}
              {getDualValue(dldFee).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(dldFee).secondary})</span>
              )}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.oqoodAdmin}</span>
            <span style={valueStyle}>
              {getDualValue(oqoodFee).primary}
              {getDualValue(oqoodFee).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(oqoodFee).secondary})</span>
              )}
            </span>
          </div>
          
          <div style={{ ...rowStyle, borderTop: '1px solid hsl(var(--theme-border))', marginTop: '4px', paddingTop: '8px' }}>
            <span style={{ ...labelStyle, fontWeight: 600 }}>{t.totalEntry}</span>
            <span style={{ ...valueStyle, fontWeight: 700, color: 'hsl(var(--primary))' }}>
              {getDualValue(entryTotal).primary}
              {getDualValue(entryTotal).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(entryTotal).secondary})</span>
              )}
            </span>
          </div>
        </div>

        {/* The Journey */}
        {sortedPayments.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ ...sectionHeaderStyle, color: 'rgb(34, 211, 238)' }}>{t.theJourney} ({totalMonths}mo)</div>
            
            {sortedPayments.map((payment, index) => {
              const amount = basePrice * (payment.paymentPercent / 100);
              const dateStr = getPaymentDate(payment);
              const labelWithDate = dateStr ? `${getPaymentLabel(payment)} (${dateStr})` : getPaymentLabel(payment);
              
              return (
                <div key={index} style={rowStyle}>
                  <span style={labelStyle}>{labelWithDate}</span>
                  <span style={valueStyle}>
                    {getDualValue(amount).primary}
                    {getDualValue(amount).secondary && (
                      <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(amount).secondary})</span>
                    )}
                  </span>
                </div>
              );
            })}
            
            <div style={{ ...rowStyle, borderTop: '1px solid hsl(var(--theme-border))', marginTop: '4px', paddingTop: '8px' }}>
              <span style={{ ...labelStyle, fontWeight: 600 }}>{t.subtotal}</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: 'rgb(34, 211, 238)' }}>
                {getDualValue(journeyTotal).primary}
                {getDualValue(journeyTotal).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(journeyTotal).secondary})</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Handover */}
        {handoverPercent > 0 && (
          <div style={sectionStyle}>
            <div style={{ ...sectionHeaderStyle, color: 'rgb(74, 222, 128)' }}>{t.handover} ({handoverPercent}%)</div>
            <div style={rowStyle}>
              <span style={{ ...labelStyle, fontWeight: 600 }}>{hasPostHandoverPlan ? t.handoverPayment : t.finalPayment}</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: 'rgb(74, 222, 128)' }}>
                {getDualValue(handoverAmount).primary}
                {getDualValue(handoverAmount).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(handoverAmount).secondary})</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Post-Handover Section */}
        {hasPostHandoverPlan && postHandoverPaymentsToUse.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ ...sectionHeaderStyle, color: '#a855f7' }}>
              {t.postHandover} ({Math.round(postHandoverPaymentsToUse.reduce((s, p) => s + p.paymentPercent, 0))}%)
            </div>
            {postHandoverPaymentsToUse.map((payment, index) => {
              const amount = basePrice * (payment.paymentPercent / 100);
              return (
                <div key={index} style={rowStyle}>
                  <span style={labelStyle}>
                    {payment.label || `+${payment.triggerValue} ${t.months}`}
                  </span>
                  <span style={valueStyle}>
                    {getDualValue(amount).primary}
                    {getDualValue(amount).secondary && (
                      <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(amount).secondary})</span>
                    )}
                  </span>
                </div>
              );
            })}
            <div style={{ ...rowStyle, borderTop: '1px solid hsl(var(--theme-border))', marginTop: '4px', paddingTop: '8px' }}>
              <span style={{ ...labelStyle, fontWeight: 600 }}>{t.subtotal}</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: '#a855f7' }}>
                {getDualValue(postHandoverTotal).primary}
                {getDualValue(postHandoverTotal).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(postHandoverTotal).secondary})</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Grand Total Summary */}
        <div style={{ borderTop: '1px solid hsl(var(--theme-border))', paddingTop: '8px' }}>
          {hasPostHandoverPlan && postHandoverTotal > 0 ? (
            /* Post-handover plan: show Pre/Post breakdown */
            <>
              <div style={rowStyle}>
                <span style={labelStyle}>{t.paidUntilHandover}</span>
                <span style={{ ...valueStyle, color: 'rgb(74, 222, 128)' }}>
                  {getDualValue(totalUntilHandover).primary}
                  {getDualValue(totalUntilHandover).secondary && (
                    <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(totalUntilHandover).secondary})</span>
                  )}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{t.paidPostHandover}</span>
                <span style={{ ...valueStyle, color: '#a855f7' }}>
                  {getDualValue(postHandoverTotal).primary}
                  {getDualValue(postHandoverTotal).secondary && (
                    <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(postHandoverTotal).secondary})</span>
                  )}
                </span>
              </div>
            </>
          ) : (
            /* Standard plan: show Base Price + Fees breakdown */
            <>
              <div style={rowStyle}>
                <span style={labelStyle}>{t.basePropertyPrice}</span>
                <span style={valueStyle}>
                  {getDualValue(basePrice).primary}
                  {getDualValue(basePrice).secondary && (
                    <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(basePrice).secondary})</span>
                  )}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{t.transactionFees}</span>
                <span style={{ ...valueStyle, color: 'hsl(var(--theme-text-muted))' }}>
                  {getDualValue(dldFee + oqoodFee).primary}
                  {getDualValue(dldFee + oqoodFee).secondary && (
                    <span style={{ marginLeft: '4px' }}>({getDualValue(dldFee + oqoodFee).secondary})</span>
                  )}
                </span>
              </div>
            </>
          )}
          
          {/* Total Investment - always show */}
          <div style={{ ...rowStyle, fontSize: '14px' }}>
            <span style={{ ...labelStyle, fontWeight: 600, fontSize: '14px' }}>{t.totalInvestment}</span>
            <span style={{ ...valueStyle, fontWeight: 700, fontSize: '14px' }}>
              {getDualValue(grandTotal).primary}
              {getDualValue(grandTotal).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400, fontSize: '12px' }}>({getDualValue(grandTotal).secondary})</span>
              )}
            </span>
          </div>
        </div>

        {/* Value Differentiators */}
        {valueDifferentiators.length > 0 && (
          <div style={{ borderTop: '1px dashed hsl(var(--theme-border))', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ ...sectionHeaderStyle, color: 'rgb(250, 204, 21)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✨ {t.valueAdds}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {valueDifferentiators.map((diff, i) => (
                <span 
                  key={i}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(250, 204, 21, 0.1)',
                    color: 'rgb(250, 204, 21)',
                    borderRadius: '9999px',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                  }}
                >
                  {diff}
                </span>
              ))}
              {appreciationBonus > 0 && (
                <span 
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    color: 'rgb(74, 222, 128)',
                    borderRadius: '9999px',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                  }}
                >
                  +{appreciationBonus}% {t.bonus}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMilestone } from '../useOICalculations';

interface OutOfPocketTimelineProps {
  // Off-Plan Data
  basePrice: number;
  downpaymentPercent: number;
  additionalPayments: PaymentMilestone[];
  handoverPercent: number;
  totalMonths: number;
  propertyValueAtHandover: number;
  entryCosts: number;
  
  // Comparison
  secondaryCapitalDay1: number;
}

interface TimelineEvent {
  month: number;
  label: string;
  amount: number;
  cumulative: number;
  type: 'payment' | 'milestone';
}

export const OutOfPocketTimeline = ({
  basePrice,
  downpaymentPercent,
  additionalPayments,
  handoverPercent,
  totalMonths,
  propertyValueAtHandover,
  entryCosts,
  secondaryCapitalDay1,
}: OutOfPocketTimelineProps) => {
  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];
    let cumulative = 0;
    
    // Downpayment at month 0
    const downpaymentAmount = basePrice * downpaymentPercent / 100;
    cumulative += downpaymentAmount + entryCosts;
    events.push({
      month: 0,
      label: 'Booking + Costos',
      amount: downpaymentAmount + entryCosts,
      cumulative,
      type: 'payment',
    });
    
    // Additional payments during construction
    additionalPayments
      .filter(p => p.paymentPercent > 0)
      .sort((a, b) => a.triggerValue - b.triggerValue)
      .forEach((payment, index) => {
        const amount = basePrice * payment.paymentPercent / 100;
        cumulative += amount;
        
        // Estimate month based on payment type
        const estimatedMonth = payment.type === 'time' 
          ? payment.triggerValue 
          : (payment.triggerValue / 100) * totalMonths;
        
        events.push({
          month: Math.round(estimatedMonth),
          label: payment.label || `Cuota ${index + 1}`,
          amount,
          cumulative,
          type: 'payment',
        });
      });
    
    // Handover payment
    const handoverAmount = basePrice * handoverPercent / 100;
    cumulative += handoverAmount;
    events.push({
      month: totalMonths,
      label: 'Handover',
      amount: handoverAmount,
      cumulative,
      type: 'milestone',
    });
    
    return events;
  }, [basePrice, downpaymentPercent, additionalPayments, handoverPercent, totalMonths, entryCosts]);

  const totalOutOfPocket = timeline[timeline.length - 1]?.cumulative || 0;
  const appreciationDuringConstruction = propertyValueAtHandover - basePrice;
  const appreciationPercent = ((propertyValueAtHandover - basePrice) / basePrice * 100).toFixed(1);
  
  // Capital comparison
  const capitalAdvantage = secondaryCapitalDay1 - (timeline[0]?.amount || 0);
  const capitalAdvantagePercent = (capitalAdvantage / secondaryCapitalDay1 * 100).toFixed(0);

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-theme-text flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Capital "Out of Pocket" (Off-Plan)
        </CardTitle>
        <p className="text-sm text-theme-text-muted">
          Dinero invertido sin retorno durante {totalMonths} meses de construcción
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-500">Capital Día 0</span>
            </div>
            <p className="text-lg font-bold text-theme-text">
              AED {(timeline[0]?.amount / 1000).toFixed(0)}K
            </p>
            <p className="text-[10px] text-theme-text-muted mt-1">
              vs AED {(secondaryCapitalDay1 / 1000).toFixed(0)}K secundaria
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-red-500">Total Sin Ingreso</span>
            </div>
            <p className="text-lg font-bold text-theme-text">
              AED {(totalOutOfPocket / 1000).toFixed(0)}K
            </p>
            <p className="text-[10px] text-theme-text-muted mt-1">
              {totalMonths} meses sin renta
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-500">Pero... Apreciación</span>
            </div>
            <p className="text-lg font-bold text-theme-text">
              +{appreciationPercent}%
            </p>
            <p className="text-[10px] text-theme-text-muted mt-1">
              AED {(appreciationDuringConstruction / 1000).toFixed(0)}K ganados
            </p>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute top-4 left-0 right-0 h-2 bg-theme-border rounded-full" />
          
          {/* Filled progress */}
          <div 
            className="absolute top-4 left-0 h-2 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
            style={{ width: '100%' }}
          />
          
          {/* Timeline events */}
          <div className="relative flex justify-between pt-8">
            {timeline.map((event, index) => (
              <div 
                key={index}
                className="flex flex-col items-center"
                style={{ 
                  position: 'absolute',
                  left: `${(event.month / totalMonths) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Dot */}
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 -mt-[22px] z-10",
                  event.type === 'milestone' 
                    ? "bg-emerald-500 border-emerald-400" 
                    : "bg-amber-500 border-amber-400"
                )} />
                
                {/* Label */}
                <div className={cn(
                  "mt-2 text-center",
                  index % 2 === 0 ? "mt-2" : "mt-8"
                )}>
                  <p className="text-[10px] text-theme-text-muted whitespace-nowrap">
                    {event.month === 0 ? 'Día 0' : `Mes ${event.month}`}
                  </p>
                  <p className="text-xs font-medium text-theme-text whitespace-nowrap">
                    AED {(event.amount / 1000).toFixed(0)}K
                  </p>
                  <p className="text-[10px] text-theme-text-muted">
                    {event.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Spacer for timeline height */}
          <div className="h-24" />
        </div>

        {/* Key Insight */}
        <div className="p-4 rounded-lg bg-theme-accent/5 border border-theme-accent/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-theme-accent/10">
              <TrendingUp className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-theme-text mb-1">
                Ventaja del Capital Distribuido
              </p>
              <p className="text-xs text-theme-text-muted">
                Con off-plan, inicias con <span className="text-theme-accent font-medium">{capitalAdvantagePercent}% menos capital</span> que 
                comprando secundaria. Mientras pagas cuotas, tu propiedad ya está apreciando. 
                Al handover, la apreciación compensa el período sin ingresos.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison badge */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-theme-border bg-theme-bg/50">
          <div>
            <p className="text-xs text-theme-text-muted">Capital requerido Día 0</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-theme-accent/10 text-theme-accent border-theme-accent text-xs">
                Off-Plan: AED {(timeline[0]?.amount / 1000).toFixed(0)}K
              </Badge>
              <span className="text-xs text-theme-text-muted">vs</span>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500 text-xs">
                Secundaria: AED {(secondaryCapitalDay1 / 1000).toFixed(0)}K
              </Badge>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
            {capitalAdvantagePercent}% menos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

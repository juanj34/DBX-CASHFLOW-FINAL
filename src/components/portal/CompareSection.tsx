import { useMemo } from "react";
import { BarChart3, Building2, DollarSign, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDualCurrency, Currency } from "@/components/roi/currencyUtils";

interface QuoteData {
  id: string;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  inputs: any;
  unit_size_sqf?: number | null;
}

interface CompareSectionProps {
  quotes: QuoteData[];
  selectedIds: string[];
  currency: Currency;
  rate: number;
  onBack: () => void;
}

// Dual currency formatting - shows AED primary with converted value in parentheses
const fmtDual = (value: number, currency: Currency, rate: number): React.ReactNode => {
  const { primary, secondary } = formatDualCurrency(value, currency, rate);
  if (!secondary) return primary;
  return (
    <>
      {primary}
      <span className="text-theme-text-muted text-xs ml-1">({secondary})</span>
    </>
  );
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-AE").format(Math.round(value));
};

// Calculate Year 5 values from inputs
const calculateYear5Values = (inputs: any, basePrice: number) => {
  const handoverMonths = inputs.constructionMonths || 24;
  const handoverYears = Math.ceil(handoverMonths / 12);
  const growthYears = inputs.appreciationSettings?.growthPeriodYears || 5;
  
  // Appreciation rates
  const constructionApp = inputs.appreciationSettings?.constructionAppreciation || inputs.constructionAppreciation || 10;
  const growthApp = inputs.appreciationSettings?.growthAppreciation || inputs.growthAppreciation || 6;
  const matureApp = inputs.appreciationSettings?.matureAppreciation || inputs.matureAppreciation || 3;
  const rentGrowth = inputs.rentGrowthRate || 4;
  
  // Property value at Year 5 with phased appreciation
  let propertyValue = basePrice;
  for (let year = 1; year <= 5; year++) {
    let appRate: number;
    if (year <= handoverYears) {
      appRate = constructionApp;
    } else if (year <= handoverYears + growthYears) {
      appRate = growthApp;
    } else {
      appRate = matureApp;
    }
    propertyValue = propertyValue * (1 + appRate / 100);
  }
  
  // Rent at Year 5 with growth compounding (only post-handover)
  const rentalYield = inputs.rentalYield || inputs.holdAnalysis?.rentalYield || 0;
  const y1Rent = basePrice * (rentalYield / 100);
  const yearsOfRent = Math.max(0, 5 - handoverYears);
  const rentY5 = yearsOfRent > 0 ? y1Rent * Math.pow(1 + rentGrowth / 100, yearsOfRent - 1) : 0;
  
  return { propertyValue, rentY5 };
};

export const CompareSection = ({ quotes, selectedIds, currency, rate, onBack }: CompareSectionProps) => {
  const selectedQuotes = useMemo(() => 
    quotes.filter(q => selectedIds.includes(q.id)),
    [quotes, selectedIds]
  );

  // Calculate metrics for each quote
  const metrics = useMemo(() => {
    return selectedQuotes.map(quote => {
      const inputs = quote.inputs || {};
      const basePrice = inputs.basePrice || 0;
      const unitSize = quote.unit_size_sqf || inputs.unitSizeSqf || 0;
      const pricePerSqft = unitSize > 0 ? basePrice / unitSize : 0;
      const rentalYield = inputs.rentalYield || inputs.holdAnalysis?.rentalYield || 0;
      const appreciation = inputs.constructionAppreciation || inputs.appreciationSettings?.constructionAppreciation || 0;
      const handoverMonths = inputs.constructionMonths || 0;
      
      // Calculate Year 5 projections
      const year5 = calculateYear5Values(inputs, basePrice);
      
      return {
        id: quote.id,
        projectName: quote.project_name || 'Untitled',
        developer: quote.developer || '-',
        unitType: quote.unit_type || '-',
        unit: quote.unit || '-',
        price: basePrice,
        pricePerSqft,
        unitSize,
        rentalYield,
        appreciation,
        handoverMonths,
        rentYear5: year5.rentY5,
        valueYear5: year5.propertyValue,
      };
    });
  }, [selectedQuotes]);

  if (selectedQuotes.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
        <h3 className="text-lg text-theme-text mb-2">No opportunities selected</h3>
        <p className="text-theme-text-muted text-sm">
          Go to Opportunities and select 2 or more to compare them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-theme-text-muted">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h2 className="text-lg font-semibold text-theme-text">
          Comparing {selectedQuotes.length} Opportunities
        </h2>
      </div>

      {/* Comparison Table */}
      <Card className="bg-theme-card border-theme-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme-border">
                  <th className="text-left p-4 text-xs font-medium text-theme-text-muted uppercase tracking-wider bg-theme-bg/50 w-40">
                    Metric
                  </th>
                  {metrics.map((m) => (
                    <th key={m.id} className="text-left p-4 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-theme-accent/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-theme-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-theme-text text-sm">{m.projectName}</p>
                          <p className="text-xs text-theme-text-muted">{m.developer}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {/* Price */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Price
                    </div>
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4">
                      <span className="text-lg font-semibold text-theme-text">
                        {fmtDual(m.price, currency, rate)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Unit Type */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Unit Type</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4">
                      <Badge variant="secondary" className="bg-theme-bg">
                        {m.unitType}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Size */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Size</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4 text-theme-text">
                      {m.unitSize > 0 ? `${formatNumber(m.unitSize)} sqft` : '-'}
                    </td>
                  ))}
                </tr>

                {/* Price per sqft */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Price/sqft</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4 text-theme-text">
                      {m.pricePerSqft > 0 ? fmtDual(m.pricePerSqft, currency, rate) : '-'}
                    </td>
                  ))}
                </tr>

                {/* Rental Yield */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Rental Yield
                    </div>
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4">
                      <span className="text-green-400 font-medium">
                        {m.rentalYield > 0 ? `${m.rentalYield.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Appreciation */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Est. Appreciation</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4">
                      <span className="text-theme-accent font-medium">
                        {m.appreciation > 0 ? `${m.appreciation}% p.a.` : '-'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rent at Year 5 */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Rent (Year 5)</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4 text-theme-text">
                      {m.rentYear5 > 0 ? fmtDual(m.rentYear5, currency, rate) : '-'}
                    </td>
                  ))}
                </tr>

                {/* Value at Year 5 */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">Value (Year 5)</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4 text-theme-text font-medium">
                      {m.valueYear5 > 0 ? fmtDual(m.valueYear5, currency, rate) : '-'}
                    </td>
                  ))}
                </tr>

                {/* Handover */}
                <tr className="hover:bg-theme-bg/30">
                  <td className="p-4 text-sm text-theme-text-muted">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Handover
                    </div>
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-4 text-theme-text">
                      {m.handoverMonths > 0 ? `${m.handoverMonths} months` : 'Ready'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-theme-text-muted text-center">
        Click "View Analysis" on any opportunity for the full investment breakdown
      </p>
    </div>
  );
};

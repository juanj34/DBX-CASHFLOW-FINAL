import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { monthToConstruction } from '../constructionProgress';

interface ExportExitCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

const getDualValue = (value: number, currency: Currency, rate: number) => {
  const dual = formatDualCurrency(value, currency, rate);
  return { primary: dual.primary, secondary: dual.secondary };
};

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]}'${(bookingYear + yearOffset).toString().slice(-2)}`;
};

export const ExportExitCards = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
  language,
}: ExportExitCardsProps) => {
  const scenarios = exitScenarios.map((exitMonths, index) => {
    const preCalcScenario = calculations.scenarios.find(s => s.exitMonths === exitMonths);
    const isHandover = exitMonths >= calculations.totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    const constructionPct = Math.min(100, monthToConstruction(exitMonths, calculations.totalMonths));
    
    if (preCalcScenario) {
      return {
        ...preCalcScenario,
        isHandover,
        dateStr,
        constructionPct,
        exitNumber: index + 1,
      };
    }
    
    return {
      exitMonths,
      exitPrice: 0,
      totalCapitalDeployed: 0,
      trueProfit: 0,
      trueROE: 0,
      annualizedROE: 0,
      isHandover,
      dateStr,
      constructionPct,
      exitNumber: index + 1,
    };
  });

  const t = {
    exitScenarios: language === 'es' ? 'Escenarios de Salida' : 'Exit Scenarios',
    built: language === 'es' ? 'Construido' : 'Built',
    capital: language === 'es' ? 'Capital' : 'Capital',
    profit: language === 'es' ? 'Beneficio' : 'Profit',
    roe: language === 'es' ? 'ROE Total' : 'Total ROE',
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
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--theme-text))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📈 {t.exitScenarios}
        </span>
      </div>
      
      {/* Scenarios */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {scenarios.map((scenario) => (
          <div 
            key={scenario.exitMonths}
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'hsl(var(--theme-bg) / 0.5)',
              border: '1px solid hsl(var(--theme-border) / 0.3)',
            }}
          >
            {/* Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'hsl(var(--theme-accent))',
                    backgroundColor: 'hsl(var(--theme-accent) / 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  #{scenario.exitNumber}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--theme-text))' }}>
                  {scenario.exitMonths}m
                </span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--theme-text-muted))' }}>
                  {scenario.dateStr}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'rgb(251, 146, 60)', fontWeight: 500 }}>
                🔨 {scenario.constructionPct.toFixed(0)}% {t.built}
              </span>
            </div>
            
            {/* Bottom Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ color: 'hsl(var(--theme-text))', fontFamily: 'monospace' }}>
                    💰 {getDualValue(scenario.totalCapitalDeployed, currency, rate).primary}
                  </span>
                  {getDualValue(scenario.totalCapitalDeployed, currency, rate).secondary && (
                    <span style={{ color: 'hsl(var(--theme-text-muted))', fontFamily: 'monospace', fontSize: '10px' }}>
                      {getDualValue(scenario.totalCapitalDeployed, currency, rate).secondary}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span 
                    style={{ 
                      fontWeight: 500, 
                      color: scenario.trueProfit >= 0 ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit, currency, rate).primary}
                  </span>
                  {getDualValue(scenario.trueProfit, currency, rate).secondary && (
                    <span style={{ color: 'hsl(var(--theme-text-muted))', fontFamily: 'monospace', fontSize: '10px' }}>
                      {scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit, currency, rate).secondary}
                    </span>
                  )}
                </div>
              </div>
              <span 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  fontFamily: 'monospace',
                  color: scenario.trueROE >= 0 ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {scenario.trueROE?.toFixed(0) ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

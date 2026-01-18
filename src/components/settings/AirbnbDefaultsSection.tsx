import { Home, Info, Percent, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AirbnbDefaultsSectionProps {
  language: 'en' | 'es';
  adr: number;
  occupancyPercent: number;
  expensePercent: number;
  managementPercent: number;
  adrGrowthRate: number;
  setAdr: (v: number) => void;
  setOccupancyPercent: (v: number) => void;
  setExpensePercent: (v: number) => void;
  setManagementPercent: (v: number) => void;
  setAdrGrowthRate: (v: number) => void;
}

export const AirbnbDefaultsSection = ({
  language,
  adr,
  occupancyPercent,
  expensePercent,
  managementPercent,
  adrGrowthRate,
  setAdr,
  setOccupancyPercent,
  setExpensePercent,
  setManagementPercent,
  setAdrGrowthRate,
}: AirbnbDefaultsSectionProps) => {
  const grossRevenue = adr * 365 * (occupancyPercent / 100);
  const netRevenue = grossRevenue * (1 - expensePercent / 100 - managementPercent / 100);

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-pink-400" />
          <CardTitle className="text-base font-semibold text-theme-text">
            {language === 'es' ? 'Airbnb/STR Predeterminado' : 'Default Airbnb/STR Settings'}
          </CardTitle>
        </div>
        <CardDescription className="text-theme-text-muted text-sm">
          {language === 'es' 
            ? 'Valores predeterminados para comparación de alquiler a corto plazo.'
            : 'Default values for short-term rental comparison.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ADR */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-theme-text">
              {language === 'es' ? 'Tarifa Diaria Promedio (ADR)' : 'Average Daily Rate (ADR)'}
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                  <p className="text-xs text-theme-text">
                    {language === 'es' 
                      ? 'Precio promedio por noche en AED. Varía según ubicación y tipo de propiedad.'
                      : 'Average nightly price in AED. Varies by location and property type.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">AED</span>
            <Input
              type="number"
              step="50"
              min="200"
              max="3000"
              value={adr}
              onChange={(e) => setAdr(parseFloat(e.target.value) || 800)}
              className="bg-theme-bg-alt border-theme-border text-theme-text pl-12"
            />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-text">
                {language === 'es' ? 'Tasa de Ocupación' : 'Occupancy Rate'}
              </label>
            </div>
            <span className="text-sm text-pink-400 font-mono font-medium">{occupancyPercent}%</span>
          </div>
          <Slider
            value={[occupancyPercent]}
            onValueChange={([value]) => setOccupancyPercent(value)}
            min={40}
            max={95}
            step={5}
            className="roi-slider-lime"
          />
        </div>

        {/* Operating Expenses */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-text">
                {language === 'es' ? 'Gastos Operativos' : 'Operating Expenses'}
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                    <p className="text-xs text-theme-text">
                      {language === 'es' 
                        ? 'Incluye limpieza, servicios, consumibles, reparaciones.'
                        : 'Includes cleaning, utilities, consumables, repairs.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-orange-400 font-mono font-medium">{expensePercent}%</span>
          </div>
          <Slider
            value={[expensePercent]}
            onValueChange={([value]) => setExpensePercent(value)}
            min={15}
            max={40}
            step={1}
            className="roi-slider-lime"
          />
        </div>

        {/* Management Fee */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-text">
                {language === 'es' ? 'Comisión de Gestión' : 'Management Fee'}
              </label>
            </div>
            <span className="text-sm text-orange-400 font-mono font-medium">{managementPercent}%</span>
          </div>
          <Slider
            value={[managementPercent]}
            onValueChange={([value]) => setManagementPercent(value)}
            min={0}
            max={30}
            step={1}
            className="roi-slider-lime"
          />
        </div>

        {/* ADR Growth Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <label className="text-sm text-theme-text">
                {language === 'es' ? 'Crecimiento ADR Anual' : 'ADR Annual Growth'}
              </label>
            </div>
            <span className="text-sm text-green-400 font-mono font-medium">+{adrGrowthRate}%</span>
          </div>
          <Slider
            value={[adrGrowthRate]}
            onValueChange={([value]) => setAdrGrowthRate(value)}
            min={0}
            max={10}
            step={1}
            className="roi-slider-lime"
          />
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-theme-border bg-theme-bg-alt rounded-lg p-3 -mx-1">
          <div className="text-xs text-theme-text-muted mb-2">
            {language === 'es' ? 'Proyección Anual Estimada' : 'Estimated Annual Projection'}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-theme-text-muted">
                {language === 'es' ? 'Ingreso Bruto' : 'Gross Revenue'}
              </div>
              <div className="text-sm font-mono text-theme-text">
                AED {grossRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-theme-text-muted">
                {language === 'es' ? 'Ingreso Neto' : 'Net Revenue'}
              </div>
              <div className="text-sm font-mono text-green-400">
                AED {netRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

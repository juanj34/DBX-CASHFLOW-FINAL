import { Building2, Info, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MortgageDefaultsSectionProps {
  language: 'en' | 'es';
  financingPercent: number;
  interestRate: number;
  termYears: number;
  processingFee: number;
  setFinancingPercent: (v: number) => void;
  setInterestRate: (v: number) => void;
  setTermYears: (v: number) => void;
  setProcessingFee: (v: number) => void;
}

export const MortgageDefaultsSection = ({
  language,
  financingPercent,
  interestRate,
  termYears,
  processingFee,
  setFinancingPercent,
  setInterestRate,
  setTermYears,
  setProcessingFee,
}: MortgageDefaultsSectionProps) => {
  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-base font-semibold text-theme-text">
            {language === 'es' ? 'Hipoteca Predeterminada' : 'Default Mortgage Settings'}
          </CardTitle>
        </div>
        <CardDescription className="text-theme-text-muted text-sm">
          {language === 'es' 
            ? 'Valores predeterminados para nuevas cotizaciones con hipoteca.'
            : 'Default values for new quotes with mortgage.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financing Percent */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-text">
                {language === 'es' ? 'Financiamiento' : 'Financing'}
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                    <p className="text-xs text-theme-text">
                      {language === 'es' 
                        ? 'Porcentaje del valor de la propiedad a financiar. Típicamente 50-80%.'
                        : 'Percentage of property value to finance. Typically 50-80%.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-blue-400 font-mono font-medium">{financingPercent}%</span>
          </div>
          <Slider
            value={[financingPercent]}
            onValueChange={([value]) => setFinancingPercent(value)}
            min={50}
            max={80}
            step={5}
            className="roi-slider-lime"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-theme-text">
              {language === 'es' ? 'Tasa de Interés' : 'Interest Rate'}
            </label>
          </div>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="2"
              max="10"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 4.5)}
              className="bg-theme-bg-alt border-theme-border text-theme-text pr-8"
            />
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          </div>
        </div>

        {/* Loan Term */}
        <div className="space-y-2">
          <label className="text-sm text-theme-text">
            {language === 'es' ? 'Plazo del Préstamo' : 'Loan Term'}
          </label>
          <Select
            value={String(termYears)}
            onValueChange={(v) => setTermYears(parseInt(v))}
          >
            <SelectTrigger className="bg-theme-bg-alt border-theme-border text-theme-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-theme-card border-theme-border">
              <SelectItem value="15">15 {language === 'es' ? 'años' : 'years'}</SelectItem>
              <SelectItem value="20">20 {language === 'es' ? 'años' : 'years'}</SelectItem>
              <SelectItem value="25">25 {language === 'es' ? 'años' : 'years'}</SelectItem>
              <SelectItem value="30">30 {language === 'es' ? 'años' : 'years'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Processing Fee */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-theme-text">
              {language === 'es' ? 'Comisión de Procesamiento' : 'Processing Fee'}
            </label>
          </div>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="3"
              value={processingFee}
              onChange={(e) => setProcessingFee(parseFloat(e.target.value) || 1)}
              className="bg-theme-bg-alt border-theme-border text-theme-text pr-8"
            />
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

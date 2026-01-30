import { SecondaryInputs } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, Percent, TrendingUp, Banknote, Bed } from 'lucide-react';

interface SecondarySimulatorFormProps {
  inputs: SecondaryInputs;
  onChange: (inputs: SecondaryInputs) => void;
}

export const SecondarySimulatorForm = ({ inputs, onChange }: SecondarySimulatorFormProps) => {
  const handleChange = (key: keyof SecondaryInputs, value: number | boolean) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Property Details */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-theme-text flex items-center gap-2">
            <Building2 className="w-4 h-4 text-theme-accent" />
            Propiedad Secundaria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-theme-text-muted">Precio de Compra (AED)</Label>
              <Input
                type="number"
                value={inputs.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
            <div>
              <Label className="text-xs text-theme-text-muted">Tamaño (sqft)</Label>
              <Input
                type="number"
                value={inputs.unitSizeSqf}
                onChange={(e) => handleChange('unitSizeSqf', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-theme-text-muted">Costos de Cierre (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.closingCostsPercent}
                onChange={(e) => handleChange('closingCostsPercent', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
            <div>
              <Label className="text-xs text-theme-text-muted">Apreciación Anual (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.appreciationRate}
                onChange={(e) => handleChange('appreciationRate', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Long-Term Rental */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-theme-text flex items-center gap-2">
            <Home className="w-4 h-4 text-cyan-500" />
            Renta Largo Plazo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-theme-text-muted">Yield Bruto (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentalYieldPercent}
                onChange={(e) => handleChange('rentalYieldPercent', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
            <div>
              <Label className="text-xs text-theme-text-muted">Crecimiento Anual (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentGrowthRate}
                onChange={(e) => handleChange('rentGrowthRate', Number(e.target.value))}
                className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-theme-text-muted">Service Charge (AED/sqft/año)</Label>
            <Input
              type="number"
              value={inputs.serviceChargePerSqft}
              onChange={(e) => handleChange('serviceChargePerSqft', Number(e.target.value))}
              className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
            />
          </div>
        </CardContent>
      </Card>

      {/* Airbnb Comparison */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-theme-text flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-pink-500" />
              Comparar con Airbnb
            </div>
            <Switch
              checked={inputs.showAirbnbComparison}
              onCheckedChange={(checked) => handleChange('showAirbnbComparison', checked)}
            />
          </CardTitle>
        </CardHeader>
        {inputs.showAirbnbComparison && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-theme-text-muted">ADR (AED/noche)</Label>
                <Input
                  type="number"
                  value={inputs.averageDailyRate}
                  onChange={(e) => handleChange('averageDailyRate', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted">Ocupación (%)</Label>
                <Input
                  type="number"
                  value={inputs.occupancyPercent}
                  onChange={(e) => handleChange('occupancyPercent', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-theme-text-muted">Gastos Operativos (%)</Label>
                <Input
                  type="number"
                  value={inputs.operatingExpensePercent}
                  onChange={(e) => handleChange('operatingExpensePercent', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted">Management Fee (%)</Label>
                <Input
                  type="number"
                  value={inputs.managementFeePercent}
                  onChange={(e) => handleChange('managementFeePercent', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Mortgage */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-theme-text flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-500" />
              Hipoteca
            </div>
            <Switch
              checked={inputs.useMortgage}
              onCheckedChange={(checked) => handleChange('useMortgage', checked)}
            />
          </CardTitle>
        </CardHeader>
        {inputs.useMortgage && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-theme-text-muted">Financiamiento (%)</Label>
                <Input
                  type="number"
                  value={inputs.mortgageFinancingPercent}
                  onChange={(e) => handleChange('mortgageFinancingPercent', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted">Interés (%)</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={inputs.mortgageInterestRate}
                  onChange={(e) => handleChange('mortgageInterestRate', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted">Plazo (años)</Label>
                <Input
                  type="number"
                  value={inputs.mortgageLoanTermYears}
                  onChange={(e) => handleChange('mortgageLoanTermYears', Number(e.target.value))}
                  className="h-8 text-sm bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

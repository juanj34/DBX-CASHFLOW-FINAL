import { useState } from 'react';
import { Save, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { SecondaryInputs, DEFAULT_SECONDARY_INPUTS } from './types';
import { useSecondaryProperties, SecondaryProperty } from '@/hooks/useSecondaryProperties';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';

interface SecondaryPropertyStepProps {
  inputs: SecondaryInputs;
  onChange: (inputs: SecondaryInputs) => void;
  offPlanPrice?: number;
  currency?: Currency;
  rate?: number;
}

export const SecondaryPropertyStep = ({
  inputs,
  onChange,
  offPlanPrice,
  currency = 'AED',
  rate = 1,
}: SecondaryPropertyStepProps) => {
  const { properties, loading, createProperty, deleteProperty } = useSecondaryProperties();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [mortgageOpen, setMortgageOpen] = useState(inputs.useMortgage);
  const [airbnbOpen, setAirbnbOpen] = useState(inputs.showAirbnbComparison);

  // Helper to show dual currency
  const showDualCurrency = (value: number) => {
    if (currency === 'AED' || !rate) return null;
    return (
      <p className="text-[10px] text-theme-text-muted">
        ≈ {formatCurrency(value, currency, rate)}
      </p>
    );
  };

  const handleLoadProperty = (property: SecondaryProperty) => {
    onChange({
      purchasePrice: property.purchase_price,
      unitSizeSqf: property.unit_size_sqf,
      closingCostsPercent: property.closing_costs_percent,
      rentalYieldPercent: property.rental_yield_percent,
      rentGrowthRate: property.rent_growth_rate,
      appreciationRate: property.appreciation_rate,
      serviceChargePerSqft: property.service_charge_per_sqft,
      useMortgage: property.use_mortgage,
      mortgageFinancingPercent: property.mortgage_financing_percent,
      mortgageInterestRate: property.mortgage_interest_rate,
      mortgageLoanTermYears: property.mortgage_term_years,
      showAirbnbComparison: property.show_airbnb,
      averageDailyRate: property.airbnb_adr || DEFAULT_SECONDARY_INPUTS.averageDailyRate,
      occupancyPercent: property.airbnb_occupancy || DEFAULT_SECONDARY_INPUTS.occupancyPercent,
      operatingExpensePercent: property.airbnb_operating_expense || DEFAULT_SECONDARY_INPUTS.operatingExpensePercent,
      managementFeePercent: property.airbnb_management_fee || DEFAULT_SECONDARY_INPUTS.managementFeePercent,
      adrGrowthRate: DEFAULT_SECONDARY_INPUTS.adrGrowthRate,
    });
    setMortgageOpen(property.use_mortgage);
    setAirbnbOpen(property.show_airbnb);
  };

  const handleSaveProperty = async () => {
    if (!propertyName.trim()) return;
    
    await createProperty({
      name: propertyName,
      purchase_price: inputs.purchasePrice,
      unit_size_sqf: inputs.unitSizeSqf,
      closing_costs_percent: inputs.closingCostsPercent,
      rental_yield_percent: inputs.rentalYieldPercent,
      rent_growth_rate: inputs.rentGrowthRate,
      appreciation_rate: inputs.appreciationRate,
      service_charge_per_sqft: inputs.serviceChargePerSqft,
      use_mortgage: inputs.useMortgage,
      mortgage_financing_percent: inputs.mortgageFinancingPercent,
      mortgage_interest_rate: inputs.mortgageInterestRate,
      mortgage_term_years: inputs.mortgageLoanTermYears,
      show_airbnb: inputs.showAirbnbComparison,
      airbnb_adr: inputs.averageDailyRate,
      airbnb_occupancy: inputs.occupancyPercent,
      airbnb_operating_expense: inputs.operatingExpensePercent,
      airbnb_management_fee: inputs.managementFeePercent,
    });
    
    setPropertyName('');
    setSaveDialogOpen(false);
  };

  const updateInput = <K extends keyof SecondaryInputs>(key: K, value: SecondaryInputs[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="space-y-4">
        {/* Saved Properties */}
        {properties.length > 0 && (
          <div className="space-y-2">
            <Label className="text-theme-text-muted text-xs">Propiedades Guardadas</Label>
            <div className="flex flex-wrap gap-2">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="flex items-center gap-1 bg-theme-border/50 rounded-lg px-2 py-1"
                >
                  <button
                    onClick={() => handleLoadProperty(prop)}
                    className="text-xs text-theme-text hover:text-theme-accent"
                  >
                    {prop.name}
                  </button>
                  <button
                    onClick={() => deleteProperty(prop.id)}
                    className="text-theme-text-muted hover:text-red-500 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Details */}
        <Card className="p-4 bg-theme-card/50 border-theme-border space-y-4">
          <h4 className="font-medium text-theme-text text-sm">Detalles de Propiedad</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Precio de Compra (AED)</Label>
              <Input
                type="number"
                value={inputs.purchasePrice}
                onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
              {showDualCurrency(inputs.purchasePrice)}
              {offPlanPrice && (
                <p className="text-[10px] text-theme-text-muted">
                  Off-Plan: {formatCurrency(offPlanPrice, 'AED', 1)}
                  {currency !== 'AED' && ` (${formatCurrency(offPlanPrice, currency, rate)})`}
                </p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Área (sqft)</Label>
              <Input
                type="number"
                value={inputs.unitSizeSqf}
                onChange={(e) => updateInput('unitSizeSqf', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Costos de Cierre %</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.closingCostsPercent}
                onChange={(e) => updateInput('closingCostsPercent', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Yield Renta %</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentalYieldPercent}
                onChange={(e) => updateInput('rentalYieldPercent', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Apreciación %</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.appreciationRate}
                onChange={(e) => updateInput('appreciationRate', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Crecimiento Renta %</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentGrowthRate}
                onChange={(e) => updateInput('rentGrowthRate', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Service Charge/sqft (AED)</Label>
              <Input
                type="number"
                value={inputs.serviceChargePerSqft}
                onChange={(e) => updateInput('serviceChargePerSqft', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
              {showDualCurrency(inputs.serviceChargePerSqft)}
            </div>
          </div>
        </Card>

        {/* Mortgage Section */}
        <Collapsible open={mortgageOpen} onOpenChange={setMortgageOpen}>
          <Card className="p-4 bg-theme-card/50 border-theme-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Switch
                  checked={inputs.useMortgage}
                  onCheckedChange={(checked) => {
                    updateInput('useMortgage', checked);
                    setMortgageOpen(checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-medium text-theme-text text-sm">Hipoteca</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${mortgageOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Financiamiento %</Label>
                  <Input
                    type="number"
                    value={inputs.mortgageFinancingPercent}
                    onChange={(e) => updateInput('mortgageFinancingPercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Tasa de Interés %</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={inputs.mortgageInterestRate}
                    onChange={(e) => updateInput('mortgageInterestRate', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Plazo (años)</Label>
                  <Input
                    type="number"
                    value={inputs.mortgageLoanTermYears}
                    onChange={(e) => updateInput('mortgageLoanTermYears', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Airbnb Section */}
        <Collapsible open={airbnbOpen} onOpenChange={setAirbnbOpen}>
          <Card className="p-4 bg-theme-card/50 border-theme-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Switch
                  checked={inputs.showAirbnbComparison}
                  onCheckedChange={(checked) => {
                    updateInput('showAirbnbComparison', checked);
                    setAirbnbOpen(checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-medium text-theme-text text-sm">Comparar Airbnb</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${airbnbOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">ADR (AED/noche)</Label>
                  <Input
                    type="number"
                    value={inputs.averageDailyRate}
                    onChange={(e) => updateInput('averageDailyRate', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                  {showDualCurrency(inputs.averageDailyRate)}
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Ocupación %</Label>
                  <Input
                    type="number"
                    value={inputs.occupancyPercent}
                    onChange={(e) => updateInput('occupancyPercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Gastos Operativos %</Label>
                  <Input
                    type="number"
                    value={inputs.operatingExpensePercent}
                    onChange={(e) => updateInput('operatingExpensePercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">Fee Gestión %</Label>
                  <Input
                    type="number"
                    value={inputs.managementFeePercent}
                    onChange={(e) => updateInput('managementFeePercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Save for Later */}
        {!saveDialogOpen ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="w-full border-dashed border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Propiedad para Después
          </Button>
        ) : (
          <Card className="p-3 bg-theme-card/50 border-theme-border space-y-3">
            <Input
              placeholder="Nombre de la propiedad (ej: Marina 2BR)"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              className="bg-theme-card border-theme-border text-theme-text"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveProperty}
                disabled={!propertyName.trim()}
                className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
              >
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setPropertyName('');
                }}
                className="text-theme-text-muted"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

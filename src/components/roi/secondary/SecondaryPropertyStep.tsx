import { useState, useMemo } from 'react';
import { Save, FolderOpen, Plus, Trash2, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  language?: 'en' | 'es';
}

export const SecondaryPropertyStep = ({
  inputs,
  onChange,
  offPlanPrice,
  currency = 'AED',
  rate = 1,
  language = 'es',
}: SecondaryPropertyStepProps) => {
  const { properties, loading, createProperty, deleteProperty } = useSecondaryProperties();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [mortgageOpen, setMortgageOpen] = useState(inputs.useMortgage);
  const [airbnbOpen, setAirbnbOpen] = useState(inputs.showAirbnbComparison);

  const t = language === 'es' ? {
    savedProperties: 'Propiedades Guardadas',
    propertyDetails: 'Detalles de Propiedad',
    purchasePrice: 'Precio de Compra (AED)',
    area: 'Área (sqft)',
    closingCosts: 'Costos de Cierre %',
    rentalYield: 'Yield Renta %',
    appreciation: 'Apreciación %',
    rentGrowth: 'Crecimiento Renta %',
    serviceCharge: 'Service Charge/sqft (AED)',
    mortgage: 'Hipoteca',
    financing: 'Financiamiento %',
    interestRate: 'Tasa de Interés %',
    term: 'Plazo (años)',
    compareAirbnb: 'Comparar Airbnb',
    adr: 'ADR (AED/noche)',
    occupancy: 'Ocupación %',
    operatingExpense: 'Gastos Operativos %',
    managementFee: 'Fee Gestión %',
    saveForLater: 'Guardar Propiedad para Después',
    propertyNamePlaceholder: 'Nombre de la propiedad (ej: Marina 2BR)',
    save: 'Guardar',
    cancel: 'Cancelar',
    netRentSummary: 'Resumen de Renta Neta',
    grossAnnualRent: 'Renta Bruta Anual',
    serviceCharges: 'Service Charges',
    netAnnualRent: 'Renta Neta Anual',
    netYield: 'Yield Neto',
    vsGross: 'vs bruto',
  } : {
    savedProperties: 'Saved Properties',
    propertyDetails: 'Property Details',
    purchasePrice: 'Purchase Price (AED)',
    area: 'Area (sqft)',
    closingCosts: 'Closing Costs %',
    rentalYield: 'Rental Yield %',
    appreciation: 'Appreciation %',
    rentGrowth: 'Rent Growth %',
    serviceCharge: 'Service Charge/sqft (AED)',
    mortgage: 'Mortgage',
    financing: 'Financing %',
    interestRate: 'Interest Rate %',
    term: 'Term (years)',
    compareAirbnb: 'Compare Airbnb',
    adr: 'ADR (AED/night)',
    occupancy: 'Occupancy %',
    operatingExpense: 'Operating Expenses %',
    managementFee: 'Management Fee %',
    saveForLater: 'Save Property for Later',
    propertyNamePlaceholder: 'Property name (e.g., Marina 2BR)',
    save: 'Save',
    cancel: 'Cancel',
    netRentSummary: 'Net Rent Summary',
    grossAnnualRent: 'Gross Annual Rent',
    serviceCharges: 'Service Charges',
    netAnnualRent: 'Net Annual Rent',
    netYield: 'Net Yield',
    vsGross: 'vs gross',
  };

  // Calculate net rent values
  const netRentCalculation = useMemo(() => {
    const grossAnnualRent = inputs.purchasePrice * (inputs.rentalYieldPercent / 100);
    const serviceCharges = inputs.unitSizeSqf * inputs.serviceChargePerSqft;
    const netAnnualRent = grossAnnualRent - serviceCharges;
    const netYield = (netAnnualRent / inputs.purchasePrice) * 100;
    
    return {
      grossAnnualRent,
      serviceCharges,
      netAnnualRent,
      netYield,
    };
  }, [inputs.purchasePrice, inputs.rentalYieldPercent, inputs.unitSizeSqf, inputs.serviceChargePerSqft]);

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
            <Label className="text-theme-text-muted text-xs">{t.savedProperties}</Label>
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
          <h4 className="font-medium text-theme-text text-sm">{t.propertyDetails}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">{t.purchasePrice}</Label>
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
              <Label className="text-xs text-theme-text-muted">{t.area}</Label>
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
              <Label className="text-xs text-theme-text-muted">{t.closingCosts}</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.closingCostsPercent}
                onChange={(e) => updateInput('closingCostsPercent', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">{t.rentalYield}</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentalYieldPercent}
                onChange={(e) => updateInput('rentalYieldPercent', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">{t.appreciation}</Label>
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
              <Label className="text-xs text-theme-text-muted">{t.rentGrowth}</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.rentGrowthRate}
                onChange={(e) => updateInput('rentGrowthRate', Number(e.target.value))}
                className="bg-theme-card border-theme-border text-theme-text"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">{t.serviceCharge}</Label>
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

        {/* Net Rent Summary Card */}
        <Card className="p-4 bg-theme-accent/5 border-theme-accent/20 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-theme-accent" />
            <h4 className="font-medium text-theme-text text-sm">{t.netRentSummary}</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-theme-text-muted">{t.grossAnnualRent}:</span>
              <span className="text-theme-text font-medium">
                {formatCurrency(netRentCalculation.grossAnnualRent, 'AED', 1)}
                {currency !== 'AED' && (
                  <span className="text-theme-text-muted ml-1">
                    ({formatCurrency(netRentCalculation.grossAnnualRent, currency, rate)})
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-red-500">
              <span>- {t.serviceCharges} ({inputs.unitSizeSqf} × {inputs.serviceChargePerSqft}):</span>
              <span className="font-medium">
                - {formatCurrency(netRentCalculation.serviceCharges, 'AED', 1)}
              </span>
            </div>
            
            <div className="border-t border-theme-border pt-2 flex justify-between items-center">
              <span className="text-theme-text font-medium">= {t.netAnnualRent}:</span>
              <span className="text-emerald-500 font-bold">
                {formatCurrency(netRentCalculation.netAnnualRent, 'AED', 1)}
                {currency !== 'AED' && (
                  <span className="text-theme-text-muted ml-1 font-normal">
                    ({formatCurrency(netRentCalculation.netAnnualRent, currency, rate)})
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-theme-text-muted">{t.netYield}:</span>
              <span className="text-theme-accent font-medium">
                {netRentCalculation.netYield.toFixed(2)}% ({t.vsGross} {inputs.rentalYieldPercent}%)
              </span>
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
                <span className="font-medium text-theme-text text-sm">{t.mortgage}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${mortgageOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.financing}</Label>
                  <Input
                    type="number"
                    value={inputs.mortgageFinancingPercent}
                    onChange={(e) => updateInput('mortgageFinancingPercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.interestRate}</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={inputs.mortgageInterestRate}
                    onChange={(e) => updateInput('mortgageInterestRate', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.term}</Label>
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
                <span className="font-medium text-theme-text text-sm">{t.compareAirbnb}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${airbnbOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.adr}</Label>
                  <Input
                    type="number"
                    value={inputs.averageDailyRate}
                    onChange={(e) => updateInput('averageDailyRate', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                  {showDualCurrency(inputs.averageDailyRate)}
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.occupancy}</Label>
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
                  <Label className="text-xs text-theme-text-muted">{t.operatingExpense}</Label>
                  <Input
                    type="number"
                    value={inputs.operatingExpensePercent}
                    onChange={(e) => updateInput('operatingExpensePercent', Number(e.target.value))}
                    className="bg-theme-card border-theme-border text-theme-text"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-theme-text-muted">{t.managementFee}</Label>
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
            {t.saveForLater}
          </Button>
        ) : (
          <Card className="p-3 bg-theme-card/50 border-theme-border space-y-3">
            <Input
              placeholder={t.propertyNamePlaceholder}
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
                {t.save}
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
                {t.cancel}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

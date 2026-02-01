import { useState } from "react";
import { PartyPopper, Building2, Calendar, DollarSign, Home, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePortfolio, CreatePropertyInput } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
// Simple currency formatter for AED
const formatAED = (value: number) => {
  return `AED ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

interface QuoteData {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  project_name?: string | null;
  developer?: string | null;
  unit?: string | null;
  unit_type?: string | null;
  inputs?: {
    basePrice?: number;
    unitSizeSqf?: number;
    rentalYieldPercent?: number;
    [key: string]: any;
  };
}

interface ConvertToPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteData | null;
  onSuccess?: (propertyId: string) => void;
}

export const ConvertToPropertyModal = ({
  open,
  onOpenChange,
  quote,
  onSuccess,
}: ConvertToPropertyModalProps) => {
  const navigate = useNavigate();
  const { createProperty } = usePortfolio();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [hasMortgage, setHasMortgage] = useState(false);
  const [mortgageAmount, setMortgageAmount] = useState<number | undefined>();
  const [mortgageRate, setMortgageRate] = useState<number>(4.5);
  const [mortgageTerm, setMortgageTerm] = useState<number>(25);

  if (!quote) return null;

  const purchasePrice = quote.inputs?.basePrice || 0;
  const unitSize = quote.inputs?.unitSizeSqf || 0;
  const rentalYield = quote.inputs?.rentalYieldPercent || 7;
  const projectedYearlyRent = purchasePrice * (rentalYield / 100);
  const projectedMonthlyRent = projectedYearlyRent / 12;

  const handleSkip = () => {
    onOpenChange(false);
  };

  const handleAddToPortfolio = async () => {
    if (!quote.client_id) {
      // Edge case: no client linked
      return;
    }

    setIsSubmitting(true);

    const propertyData: CreatePropertyInput = {
      client_id: quote.client_id,
      source_quote_id: quote.id,
      project_name: quote.project_name || "Unknown Project",
      developer: quote.developer || undefined,
      unit: quote.unit || undefined,
      unit_type: quote.unit_type || undefined,
      unit_size_sqf: unitSize || undefined,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate,
      has_mortgage: hasMortgage,
      mortgage_amount: hasMortgage ? (mortgageAmount || purchasePrice * 0.6) : undefined,
      mortgage_balance: hasMortgage ? (mortgageAmount || purchasePrice * 0.6) : undefined,
      mortgage_interest_rate: hasMortgage ? mortgageRate : undefined,
      mortgage_term_years: hasMortgage ? mortgageTerm : undefined,
      monthly_mortgage_payment: hasMortgage 
        ? calculateMonthlyPayment(mortgageAmount || purchasePrice * 0.6, mortgageRate, mortgageTerm) 
        : undefined,
    };

    const property = await createProperty(propertyData);
    setIsSubmitting(false);

    if (property) {
      onOpenChange(false);
      onSuccess?.(property.id);
      
      // Navigate to client portfolio
      if (quote.client_id) {
        navigate(`/clients/${quote.client_id}/portfolio`);
      }
    }
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const noClientLinked = !quote.client_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PartyPopper className="w-6 h-6 text-green-400" />
            Deal Closed!
          </DialogTitle>
          <DialogDescription>
            {noClientLinked 
              ? "This quote isn't linked to a client. Link a client first to add to their portfolio."
              : `Add this property to ${quote.client_name}'s portfolio?`
            }
          </DialogDescription>
        </DialogHeader>

        {noClientLinked ? (
          <div className="py-4 text-center text-theme-text-muted">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Go to the quote editor and assign a client to enable portfolio tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Property Summary - Read-only */}
            <div className="bg-theme-card/50 border border-theme-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-theme-accent" />
                <span className="font-medium">{quote.project_name}</span>
                {quote.developer && (
                  <span className="text-theme-text-muted">by {quote.developer}</span>
                )}
              </div>
              {(quote.unit || quote.unit_type) && (
                <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                  <Home className="w-4 h-4" />
                  <span>{[quote.unit_type, quote.unit].filter(Boolean).join(" • ")}</span>
                  {unitSize > 0 && <span>• {unitSize.toLocaleString()} sqft</span>}
                </div>
              )}
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-green-400">{formatAED(purchasePrice)}</span>
                </div>
                <div className="flex items-center gap-2 ml-6 text-theme-text-muted">
                  <span>Est. Rent:</span>
                  <span className="font-medium text-theme-text">{formatAED(projectedYearlyRent)}/yr</span>
                  <span className="text-xs opacity-70">({formatAED(projectedMonthlyRent)}/mo)</span>
                </div>
              </div>
            </div>

            {/* Purchase Date - Editable */}
            <div className="space-y-2">
              <Label htmlFor="purchase-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Purchase Date
              </Label>
              <Input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="bg-theme-bg border-theme-border"
              />
            </div>

            {/* Mortgage Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-mortgage" className="cursor-pointer">
                  Has Mortgage?
                </Label>
                <Switch
                  id="has-mortgage"
                  checked={hasMortgage}
                  onCheckedChange={setHasMortgage}
                />
              </div>

              {hasMortgage && (
                <div className="space-y-3 pl-4 border-l-2 border-theme-border">
                  <div className="space-y-1">
                    <Label htmlFor="mortgage-amount" className="text-xs text-theme-text-muted">
                      Mortgage Amount (AED)
                    </Label>
                    <Input
                      id="mortgage-amount"
                      type="number"
                      placeholder={String(Math.round(purchasePrice * 0.6))}
                      value={mortgageAmount || ""}
                      onChange={(e) => setMortgageAmount(e.target.value ? Number(e.target.value) : undefined)}
                      className="bg-theme-bg border-theme-border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="mortgage-rate" className="text-xs text-theme-text-muted">
                        Interest Rate (%)
                      </Label>
                      <Input
                        id="mortgage-rate"
                        type="number"
                        step="0.1"
                        value={mortgageRate}
                        onChange={(e) => setMortgageRate(Number(e.target.value))}
                        className="bg-theme-bg border-theme-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mortgage-term" className="text-xs text-theme-text-muted">
                        Term (years)
                      </Label>
                      <Input
                        id="mortgage-term"
                        type="number"
                        value={mortgageTerm}
                        onChange={(e) => setMortgageTerm(Number(e.target.value))}
                        className="bg-theme-bg border-theme-border"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-theme-text-muted"
          >
            Skip
          </Button>
          {!noClientLinked && (
            <Button
              onClick={handleAddToPortfolio}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Portfolio"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

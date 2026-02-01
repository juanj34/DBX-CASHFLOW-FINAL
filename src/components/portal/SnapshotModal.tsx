import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Currency } from "@/components/roi/currencyUtils";
import { SnapshotContent } from "@/components/roi/snapshot/SnapshotContent";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SnapshotModalProps {
  quoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  language: 'en' | 'es';
  rate: number;
  onDownload?: (quoteId: string) => void;
}

interface QuoteData {
  id: string;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  unit_size_sqf: number | null;
  share_token: string | null;
  inputs: any;
  client_name?: string | null;
  client_country?: string | null;
}

export const SnapshotModal = ({
  quoteId,
  open,
  onOpenChange,
  currency,
  language,
  rate,
  onDownload,
}: SnapshotModalProps) => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch quote data when modal opens
  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId || !open) {
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cashflow_quotes')
          .select('id, project_name, developer, unit, unit_type, unit_size_sqf, share_token, inputs, client_name, client_country')
          .eq('id', quoteId)
          .single();

        if (error) throw error;
        setQuote(data);
      } catch (error) {
        console.error('Error fetching quote for snapshot:', error);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId, open]);

  // Parse and migrate inputs
  const inputs: OIInputs | null = useMemo(() => {
    if (!quote?.inputs) return null;
    return migrateInputs(quote.inputs);
  }, [quote?.inputs]);

  // Calculations
  const calculations = useOICalculations(inputs || NEW_QUOTE_OI_INPUTS);

  // Client info
  const clientInfo: ClientUnitData = useMemo(() => {
    if (!quote) {
      return {
        developer: '',
        projectName: '',
        clients: [],
        brokerName: '',
        unit: '',
        unitSizeSqf: 0,
        unitSizeM2: 0,
        unitType: '',
      };
    }
    return {
      developer: quote.developer || '',
      projectName: quote.project_name || '',
      clients: quote.client_name ? [{ id: '1', name: quote.client_name, country: quote.client_country || '' }] : [],
      brokerName: '',
      unit: quote.unit || '',
      unitSizeSqf: quote.unit_size_sqf || 0,
      unitSizeM2: Math.round((quote.unit_size_sqf || 0) * 0.0929),
      unitType: quote.unit_type || '',
    };
  }, [quote]);

  // Mortgage inputs
  const mortgageInputs: MortgageInputs = useMemo(() => {
    if (!inputs) return DEFAULT_MORTGAGE_INPUTS;
    return (inputs as any).mortgageInputs || DEFAULT_MORTGAGE_INPUTS;
  }, [inputs]);

  // Mortgage analysis
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations.basePrice,
    preHandoverPercent: inputs?.preHandoverPercent || 100,
    monthlyRent: calculations.holdAnalysis?.annualRent ? calculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: calculations.holdAnalysis?.annualServiceCharges ? calculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });

  // Exit scenarios
  const exitScenarios: number[] = useMemo(() => {
    if (!inputs) return [];
    return ((inputs as any).exitScenarios || []).map((e: any) => typeof e === 'number' ? e : e.months);
  }, [inputs]);

  // Quote images (always return object with required shape)
  const quoteImages = useMemo(() => {
    const inp = inputs as any;
    return {
      heroImageUrl: inp?.heroImageUrl || null,
      floorPlanUrl: inp?.floorPlanUrl || null,
      buildingRenderUrl: inp?.buildingRenderUrl || null,
    };
  }, [inputs]);

  const handleOpenExternal = () => {
    if (quote?.share_token) {
      window.open(`/view/${quote.share_token}?currency=${currency}&lang=${language}`, '_blank');
    }
  };

  const handleDownload = () => {
    if (quoteId && onDownload) {
      onDownload(quoteId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-theme-bg border-theme-border overflow-hidden">
        <DialogHeader className="p-4 border-b border-theme-border flex flex-row items-center justify-between sticky top-0 bg-theme-bg z-10">
          <DialogTitle className="text-theme-text">
            {quote?.project_name || 'Investment Analysis'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-theme-border bg-theme-card text-theme-text hover:bg-theme-bg"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            )}
            {quote?.share_token && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="border-theme-border bg-theme-card text-theme-text hover:bg-theme-bg"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Open Full Page
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-theme-text-muted hover:text-theme-text"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-theme-accent animate-spin" />
            </div>
          ) : quote && inputs && quoteImages ? (
            <div className="p-6">
              <SnapshotContent
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo}
                mortgageInputs={mortgageInputs}
                mortgageAnalysis={mortgageAnalysis}
                exitScenarios={exitScenarios}
                quoteImages={quoteImages}
                currency={currency}
                language={language}
                rate={rate}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-24">
              <p className="text-theme-text-muted">Unable to load analysis</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

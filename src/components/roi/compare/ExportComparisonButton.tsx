import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { useProfile } from '@/hooks/useProfile';

interface ExportComparisonButtonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  title?: string;
  disabled?: boolean;
}

export const ExportComparisonButton = ({
  quotesWithCalcs,
  title = 'Property Comparison',
  disabled = false,
}: ExportComparisonButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const { profile } = useProfile();

  const handleExportPDF = async () => {
    if (quotesWithCalcs.length < 2) {
      toast.error('Select at least 2 quotes to export');
      return;
    }

    setExporting(true);
    toast.info('Generating comparison report...');

    try {
      const exportData = {
        title,
        advisorName: profile?.full_name || 'Investment Advisor',
        advisorEmail: profile?.business_email || profile?.email,
        advisorPhone: profile?.whatsapp_country_code && profile?.whatsapp_number 
          ? `${profile.whatsapp_country_code}${profile.whatsapp_number}` 
          : null,
        quotes: quotesWithCalcs.map(({ quote, calculations }) => ({
          id: quote.id,
          title: quote.title || 'Untitled',
          projectName: quote.projectName,
          developer: quote.developer,
          inputs: quote.inputs,
          metrics: {
            basePrice: calculations?.basePrice || 0,
            totalInvestment: calculations?.holdAnalysis?.totalCapitalInvested || 0,
            annualRent: calculations?.holdAnalysis?.annualRent || 0,
            netAnnualRent: calculations?.holdAnalysis?.netAnnualRent || 0,
            rentalYield: calculations?.holdAnalysis?.rentalYieldOnInvestment || 0,
            roiAtExit: calculations?.scenarios?.[0]?.roe || 0,
            annualizedROE: calculations?.scenarios?.[0]?.annualizedROE || 0,
            constructionMonths: (quote.inputs as any)?.constructionPeriodMonths || 0,
            propertyValueAtHandover: calculations?.holdAnalysis?.propertyValueAtHandover || 0,
          },
        })),
      };

      const { data, error } = await supabase.functions.invoke('generate-comparison-pdf', {
        body: exportData,
      });

      if (error) throw error;

      // Open in new window for print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data);
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 500);
        };
        toast.success('Report ready to print');
      } else {
        toast.error('Please allow popups to view the PDF');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to generate report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      variant="outline"
      className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
      disabled={disabled || exporting || quotesWithCalcs.length < 2}
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Export</span>
    </Button>
  );
};

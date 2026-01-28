/**
 * usePDFExport - Hook for generating professional PDF snapshots
 * 
 * Uses the new jsPDF-based generator for clean, professional output.
 */

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { downloadSnapshotPDF, PDFExportData } from '@/lib/pdfGenerator';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';

interface UsePDFExportProps {
  projectName?: string;
}

interface ExportData {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const usePDFExport = ({ projectName }: UsePDFExportProps = {}) => {
  const [exporting, setExporting] = useState(false);

  const exportPDF = useCallback(async (data: ExportData): Promise<{ success: boolean; error?: string }> => {
    setExporting(true);
    
    toast({
      title: 'Generating PDF...',
      description: 'Creating your investment snapshot.',
    });

    try {
      const result = await downloadSnapshotPDF({
        ...data,
        projectName: projectName || data.clientInfo?.projectName,
      });

      if (result.success) {
        toast({
          title: 'PDF Ready',
          description: 'Your investment snapshot has been downloaded.',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to generate PDF.',
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setExporting(false);
    }
  }, [projectName]);

  return {
    exporting,
    exportPDF,
  };
};

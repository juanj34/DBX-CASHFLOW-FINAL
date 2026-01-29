/**
 * usePDFExport - Hook for generating PDF snapshots using DOM capture
 * 
 * Uses the ExportSnapshotDOM component rendered off-screen and captured
 * with html2canvas for pixel-perfect output matching the live view.
 */

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useExportRenderer } from '@/hooks/useExportRenderer';
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
  
  const { exportSnapshot } = useExportRenderer({
    projectName,
  });

  const exportPDF = useCallback(async (data: ExportData): Promise<{ success: boolean; error?: string }> => {
    setExporting(true);
    
    toast({
      title: 'Generating PDF...',
      description: 'Creating your investment snapshot.',
    });

    try {
      // Use the DOM-based export renderer for consistent output
      const result = await exportSnapshot(
        {
          inputs: data.inputs,
          calculations: data.calculations,
          clientInfo: data.clientInfo,
          mortgageInputs: data.mortgageInputs,
          mortgageAnalysis: data.mortgageAnalysis,
          exitScenarios: data.exitScenarios,
          currency: data.currency,
          rate: data.rate,
          language: data.language,
        },
        'pdf'
      );

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
  }, [exportSnapshot]);

  return {
    exporting,
    exportPDF,
  };
};

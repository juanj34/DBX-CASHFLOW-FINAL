// Simple PDF export helper that calls the Edge Function
// Uses 'any' types intentionally to avoid complex type inference that causes compiler issues

import { supabase } from "@/integrations/supabase/client";

interface ExportData {
  inputs: any;
  clientInfo: any;
  calculations: any;
  exitScenarios: number[];
  advisorName: string;
  currency: string;
  rate: number;
}

export const exportCashflowPDF = async (data: ExportData): Promise<void> => {
  const { data: response, error } = await supabase.functions.invoke('generate-pdf', {
    body: data,
  });

  if (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }

  // The response is HTML - open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(response);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

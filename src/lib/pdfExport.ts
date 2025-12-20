import { supabase } from "@/integrations/supabase/client";
import { ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { toast } from "@/hooks/use-toast";

interface ExportData {
  inputs: any;
  clientInfo: any;
  calculations: any;
  exitScenarios: number[];
  advisorName: string;
  currency: string;
  rate: number;
  visibility?: ViewVisibility;
}

export const exportCashflowPDF = async (data: ExportData): Promise<boolean> => {
  const toastId = toast({
    title: "Generating PDF...",
    description: "Please wait while we prepare your document.",
  });

  try {
    const { data: response, error } = await supabase.functions.invoke('generate-pdf', {
      body: data,
    });

    if (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
      return false;
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
      
      toast({
        title: "PDF Ready",
        description: "Your document is ready to print or save.",
      });
      return true;
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to view the PDF.",
        variant: "destructive",
      });
      return false;
    }
  } catch (err) {
    console.error('PDF export error:', err);
    toast({
      title: "Export Failed",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

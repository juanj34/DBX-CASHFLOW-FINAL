import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';

type FormatType = 'png' | 'pdf';

interface UseClientExportProps {
  contentRef: React.RefObject<HTMLElement>;
  projectName?: string;
}

interface ExportOptions {
  format: FormatType;
  viewName: string;
}

export const useClientExport = ({ contentRef, projectName }: UseClientExportProps) => {
  const [exporting, setExporting] = useState(false);

  const captureElement = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!contentRef.current) {
      console.error('Content ref is not available');
      return null;
    }

    // Add export mode class to hide sidebar/nav and force auto height
    document.body.classList.add('export-mode');

    // Wait for CSS to apply and layout to reflow
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Force a reflow to ensure layout updates
    if (contentRef.current) {
      void contentRef.current.offsetHeight;
    }

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // 2x resolution for high quality
        useCORS: true, // Allow cross-origin images
        backgroundColor: null, // Preserve transparent backgrounds
        logging: false, // Disable console logs
        allowTaint: false, // Prevent tainted canvas issues
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
      });

      return canvas;
    } catch (error) {
      console.error('html2canvas error:', error);
      return null;
    } finally {
      // Remove export mode class to restore UI
      document.body.classList.remove('export-mode');
    }
  }, [contentRef]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportImage = useCallback(async (viewName: string): Promise<boolean> => {
    const canvas = await captureElement();
    if (!canvas) return false;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${projectName || 'investment'}-${viewName}.png`;
          downloadBlob(blob, filename);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 'image/png', 1.0);
    });
  }, [captureElement, projectName, downloadBlob]);

  const exportPdf = useCallback(async (viewName: string): Promise<boolean> => {
    const canvas = await captureElement();
    if (!canvas) return false;

    try {
      // Use JPEG for PDF - much smaller file size (85% quality)
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Calculate dimensions - maintain aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Create PDF with custom dimensions matching the content
      // Convert pixels to mm (1 inch = 96 pixels, 1 inch = 25.4 mm)
      const pxToMm = 25.4 / 96;
      const pdfWidth = (imgWidth / 2) * pxToMm; // Divide by 2 because we used scale: 2
      const pdfHeight = (imgHeight / 2) * pxToMm;
      
      const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const filename = `${projectName || 'investment'}-${viewName}.pdf`;
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      return false;
    }
  }, [captureElement, projectName]);

  const exportView = useCallback(async ({ format, viewName }: ExportOptions): Promise<boolean> => {
    setExporting(true);
    
    try {
      const success = format === 'pdf' 
        ? await exportPdf(viewName)
        : await exportImage(viewName);
      
      return success;
    } finally {
      setExporting(false);
    }
  }, [exportImage, exportPdf]);

  const exportBothViews = useCallback(async (
    format: FormatType,
    currentView: 'cashflow' | 'snapshot',
    onViewChange: (view: 'cashflow' | 'snapshot') => void
  ): Promise<{ cashflowSuccess: boolean; snapshotSuccess: boolean }> => {
    setExporting(true);
    
    try {
      // Export current view first
      const firstView = currentView;
      const secondView = currentView === 'cashflow' ? 'snapshot' : 'cashflow';
      
      const firstSuccess = format === 'pdf'
        ? await exportPdf(firstView)
        : await exportImage(firstView);
      
      // Switch to other view
      onViewChange(secondView);
      
      // Wait for React to render the new view
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const secondSuccess = format === 'pdf'
        ? await exportPdf(secondView)
        : await exportImage(secondView);
      
      // Switch back to original view
      onViewChange(currentView);
      
      return {
        cashflowSuccess: currentView === 'cashflow' ? firstSuccess : secondSuccess,
        snapshotSuccess: currentView === 'snapshot' ? firstSuccess : secondSuccess,
      };
    } finally {
      setExporting(false);
    }
  }, [exportImage, exportPdf]);

  return {
    exporting,
    exportView,
    exportBothViews,
  };
};

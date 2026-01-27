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

  const getBackgroundColor = useCallback((element: HTMLElement): string => {
    const computedBg = getComputedStyle(element).backgroundColor;
    // Check if transparent (rgba with 0 alpha or 'transparent')
    if (computedBg === 'transparent' || computedBg === 'rgba(0, 0, 0, 0)') {
      // Fallback to body background
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      if (bodyBg === 'transparent' || bodyBg === 'rgba(0, 0, 0, 0)') {
        // Ultimate fallback - use a neutral color based on theme
        return document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff';
      }
      return bodyBg;
    }
    return computedBg;
  }, []);

  const captureElement = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!contentRef.current) {
      console.error('Content ref is not available');
      return null;
    }

    // Add export mode class to hide sidebar/nav and force auto height
    document.body.classList.add('export-mode');

    // Scroll to top for consistent capture starting point
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    // Wait for fonts to be fully loaded (prevents text baseline shifts)
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // Wait for CSS to apply and layout to reflow (300ms for complex layouts)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Force a reflow to ensure layout updates
    if (contentRef.current) {
      void contentRef.current.offsetHeight;
    }

    // Get deterministic background color
    const backgroundColor = getBackgroundColor(contentRef.current);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // 2x resolution for high quality
        useCORS: true, // Allow cross-origin images
        backgroundColor, // Use computed theme background (no transparency artifacts)
        logging: false, // Disable console logs
        allowTaint: false, // Prevent tainted canvas issues
        scrollX: 0,
        scrollY: 0,
        x: 0, // Start capture at element's left edge
        y: 0, // Start capture at element's top edge
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
        // Freeze animations/transforms in the cloned DOM to prevent text baseline drift
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            /* Freeze all animations and transitions */
            *, *::before, *::after {
              animation: none !important;
              animation-delay: 0s !important;
              animation-duration: 0s !important;
              transition: none !important;
              transition-delay: 0s !important;
              transition-duration: 0s !important;
              caret-color: transparent !important;
            }
            
            /* Neutralize transforms on elements that might have scale/translate */
            /* This prevents text baseline drift caused by sub-pixel transforms */
            [style*="transform"],
            [class*="motion"],
            [data-framer-name],
            .framer-motion {
              transform: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
          
          // Additionally, iterate through elements and remove inline transforms
          // that might cause text baseline issues
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedTransform = getComputedStyle(el).transform;
              // Only reset transforms that are not 'none' and contain scale/matrix
              if (computedTransform && computedTransform !== 'none') {
                // Check if it's a subtle scale (like scale(1.00001)) which causes text drift
                if (computedTransform.includes('matrix') || computedTransform.includes('scale')) {
                  el.style.transform = 'none';
                }
              }
            }
          });
        },
      });

      return canvas;
    } catch (error) {
      console.error('html2canvas error:', error);
      return null;
    } finally {
      // Remove export mode class to restore UI
      document.body.classList.remove('export-mode');
    }
  }, [contentRef, getBackgroundColor]);

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

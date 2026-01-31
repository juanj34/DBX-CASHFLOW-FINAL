import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportComparisonDOM, ExportComparisonDOMProps } from '@/components/roi/secondary/export';

type FormatType = 'png' | 'pdf';

interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * useComparisonExport - Offscreen DOM export hook for comparison tool
 */
export const useComparisonExport = () => {
  const [exporting, setExporting] = useState(false);

  const getBackgroundColor = useCallback((): string => {
    const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
    if (computedBg) {
      return `hsl(${computedBg})`;
    }
    return document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff';
  }, []);

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

  const exportComparison = useCallback(async (
    props: ExportComparisonDOMProps,
    format: FormatType,
    filename: string = 'comparison'
  ): Promise<ExportResult> => {
    setExporting(true);

    // Create offscreen container
    const container = document.createElement('div');
    container.id = 'export-comparison-container';
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1587px;
      pointer-events: none;
      overflow: visible;
    `;
    document.body.appendChild(container);

    try {
      // Render the export DOM
      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(<ExportComparisonDOM {...props} />);
        setTimeout(resolve, 200);
      });

      // Wait for fonts
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Wait for layout
      await new Promise(resolve => setTimeout(resolve, 400));
      void container.offsetHeight;

      const exportElement = container.firstElementChild as HTMLElement;
      if (!exportElement) {
        throw new Error('Export element not found');
      }

      const backgroundColor = getBackgroundColor();

      // Capture
      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor,
        logging: false,
        allowTaint: false,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
      });

      root.unmount();

      // Generate output
      if (format === 'png') {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              downloadBlob(blob, `${filename}.png`);
              resolve({ success: true });
            } else {
              resolve({ success: false, error: 'Failed to generate PNG' });
            }
          }, 'image/png', 1.0);
        });
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pxToMm = 25.4 / 96;
        const pdfWidth = (canvas.width / 2) * pxToMm;
        const pdfHeight = (canvas.height / 2) * pxToMm;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        container.remove();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
      setExporting(false);
    }
  }, [getBackgroundColor, downloadBlob]);

  return { exporting, exportComparison };
};

import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportSnapshotDOM, ExportSnapshotDOMProps } from '@/components/roi/export';

type FormatType = 'png' | 'pdf';

interface ExportResult {
  success: boolean;
  error?: string;
}

interface UseExportRendererProps {
  projectName?: string;
}

/**
 * useExportRenderer - Offscreen DOM export hook
 * 
 * Creates a temporary container, renders the static ExportSnapshotDOM component,
 * waits for fonts/layout, captures with html2canvas, and cleans up.
 * 
 * This approach isolates the export from the live UI, preventing animation-related
 * text baseline drift issues.
 */
export const useExportRenderer = ({ projectName }: UseExportRendererProps) => {
  const [exporting, setExporting] = useState(false);

  const getBackgroundColor = useCallback((): string => {
    // Get the theme background from CSS variables
    const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
    if (computedBg) {
      return `hsl(${computedBg})`;
    }
    // Fallback based on dark mode
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

  const renderAndCapture = useCallback(async (
    props: ExportSnapshotDOMProps,
    format: FormatType,
    viewName: string
  ): Promise<ExportResult> => {
    // Create offscreen container
    const container = document.createElement('div');
    container.id = 'export-offscreen-container';
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
      // Create React root and render the export DOM
      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(<ExportSnapshotDOM {...props} />);
        // Allow React to render
        setTimeout(resolve, 100);
      });

      // Wait for fonts to be fully loaded
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Wait for layout to stabilize (extra time for complex layouts)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Force a reflow
      void container.offsetHeight;

      // Get the rendered element
      const exportElement = container.firstElementChild as HTMLElement;
      if (!exportElement) {
        throw new Error('Export element not found');
      }

      // Get deterministic background color
      const backgroundColor = getBackgroundColor();

      // Capture with html2canvas - simplified config since we have a static DOM
      const canvas = await html2canvas(exportElement, {
        scale: 2, // 2x resolution for high quality
        useCORS: true,
        backgroundColor,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
        windowWidth: exportElement.scrollWidth,
        windowHeight: exportElement.scrollHeight,
      });

      // Cleanup React root before generating output
      root.unmount();

      // Generate output based on format
      if (format === 'png') {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const filename = `${projectName || 'investment'}-${viewName}.png`;
              downloadBlob(blob, filename);
              resolve({ success: true });
            } else {
              resolve({ success: false, error: 'Failed to generate PNG blob' });
            }
          }, 'image/png', 1.0);
        });
      } else {
        // PDF export
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Convert pixels to mm
        const pxToMm = 25.4 / 96;
        const pdfWidth = (imgWidth / 2) * pxToMm;
        const pdfHeight = (imgHeight / 2) * pxToMm;
        
        const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
        
        const pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        const filename = `${projectName || 'investment'}-${viewName}.pdf`;
        pdf.save(filename);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Export render error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // Cleanup container
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        container.remove();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }
  }, [getBackgroundColor, downloadBlob, projectName]);

  const exportSnapshot = useCallback(async (
    props: ExportSnapshotDOMProps,
    format: FormatType
  ): Promise<ExportResult> => {
    setExporting(true);
    try {
      return await renderAndCapture(props, format, 'snapshot');
    } finally {
      setExporting(false);
    }
  }, [renderAndCapture]);

  const exportBoth = useCallback(async (
    props: ExportSnapshotDOMProps,
    format: FormatType
  ): Promise<{ snapshotSuccess: boolean; cashflowSuccess: boolean }> => {
    setExporting(true);
    try {
      // For now, we only have Snapshot DOM implemented
      // Cashflow DOM would be similar
      const snapshotResult = await renderAndCapture(props, format, 'snapshot');
      
      // TODO: Add ExportCashflowDOM when needed
      // const cashflowResult = await renderAndCapture(cashflowProps, format, 'cashflow');
      
      return {
        snapshotSuccess: snapshotResult.success,
        cashflowSuccess: true, // Placeholder
      };
    } finally {
      setExporting(false);
    }
  }, [renderAndCapture]);

  return {
    exporting,
    exportSnapshot,
    exportBoth,
    renderAndCapture,
  };
};

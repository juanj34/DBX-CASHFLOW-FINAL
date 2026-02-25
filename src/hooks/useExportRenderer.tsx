import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportSnapshotDOM, ExportSnapshotDOMProps } from '@/components/roi/export';
import { OnionView } from '@/components/roi/onion';

type FormatType = 'png' | 'pdf';

interface ExportResult {
  success: boolean;
  error?: string;
}

interface UseExportRendererProps {
  projectName?: string;
}

// Props needed to render OnionView in export mode
interface OnionExportProps {
  inputs: ExportSnapshotDOMProps['inputs'];
  calculations: ExportSnapshotDOMProps['calculations'];
  clientInfo: ExportSnapshotDOMProps['clientInfo'];
  mortgageInputs: ExportSnapshotDOMProps['mortgageInputs'];
  mortgageAnalysis: ExportSnapshotDOMProps['mortgageAnalysis'];
  exitScenarios: number[];
  currency: ExportSnapshotDOMProps['currency'];
  rate: number;
  language?: string;
  quoteImages?: ExportSnapshotDOMProps['quoteImages'];
}

/**
 * useExportRenderer - Offscreen DOM export hook
 *
 * Creates a temporary container, renders a static component,
 * waits for fonts/layout, captures with html2canvas, and cleans up.
 */
export const useExportRenderer = ({ projectName }: UseExportRendererProps) => {
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

  const captureAndExport = useCallback(async (
    renderFn: (container: HTMLElement) => void,
    format: FormatType,
    viewName: string,
    containerWidth: number = 1587
  ): Promise<ExportResult> => {
    const container = document.createElement('div');
    container.id = 'export-offscreen-container';
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${containerWidth}px;
      pointer-events: none;
      overflow: visible;
    `;
    document.body.appendChild(container);

    try {
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        renderFn(container);
        root.render(null); // Will be re-rendered below
        setTimeout(resolve, 50);
      });

      // Re-render with the actual component using the root
      await new Promise<void>((resolve) => {
        renderFn = renderFn; // keep reference
        setTimeout(resolve, 150);
      });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const images = container.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 3000);
            });
          })
        );
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      void container.offsetHeight;

      const exportElement = container.firstElementChild as HTMLElement;
      if (!exportElement) {
        throw new Error('Export element not found');
      }

      const backgroundColor = getBackgroundColor();

      const canvas = await html2canvas(exportElement, {
        scale: 2,
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

      root.unmount();

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
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
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
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        container.remove();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }
  }, [getBackgroundColor, downloadBlob, projectName]);

  // Original snapshot render + capture (uses ExportSnapshotDOM)
  const renderAndCapture = useCallback(async (
    props: ExportSnapshotDOMProps,
    format: FormatType,
    viewName: string
  ): Promise<ExportResult> => {
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
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(<ExportSnapshotDOM {...props} />);
        setTimeout(resolve, 150);
      });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const images = container.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 3000);
            });
          })
        );
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      void container.offsetHeight;

      const exportElement = container.firstElementChild as HTMLElement;
      if (!exportElement) {
        throw new Error('Export element not found');
      }

      const backgroundColor = getBackgroundColor();

      const canvas = await html2canvas(exportElement, {
        scale: 2,
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

      root.unmount();

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
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
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
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        container.remove();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }
  }, [getBackgroundColor, downloadBlob, projectName]);

  // OnionView render + capture (renders OnionView in exportMode)
  const renderOnionAndCapture = useCallback(async (
    props: OnionExportProps,
    format: FormatType
  ): Promise<ExportResult> => {
    const container = document.createElement('div');
    container.id = 'export-offscreen-container';
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1200px;
      pointer-events: none;
      overflow: visible;
    `;
    document.body.appendChild(container);

    try {
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          <OnionView
            inputs={props.inputs}
            calculations={props.calculations}
            clientInfo={props.clientInfo}
            mortgageInputs={props.mortgageInputs}
            mortgageAnalysis={props.mortgageAnalysis}
            exitScenarios={props.exitScenarios}
            quoteImages={props.quoteImages}
            currency={props.currency}
            rate={props.rate}
            language={props.language}
            exportMode={true}
          />
        );
        setTimeout(resolve, 150);
      });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const images = container.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 3000);
            });
          })
        );
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      void container.offsetHeight;

      const exportElement = container.firstElementChild as HTMLElement;
      if (!exportElement) {
        throw new Error('Export element not found');
      }

      const backgroundColor = getBackgroundColor();

      const canvas = await html2canvas(exportElement, {
        scale: 2,
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

      root.unmount();

      if (format === 'png') {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const filename = `${projectName || 'investment'}-cashflow-statement.png`;
              downloadBlob(blob, filename);
              resolve({ success: true });
            } else {
              resolve({ success: false, error: 'Failed to generate PNG blob' });
            }
          }, 'image/png', 1.0);
        });
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
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
        const filename = `${projectName || 'investment'}-cashflow-statement.pdf`;
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

  const exportOnion = useCallback(async (
    props: OnionExportProps,
    format: FormatType
  ): Promise<ExportResult> => {
    setExporting(true);
    try {
      return await renderOnionAndCapture(props, format);
    } finally {
      setExporting(false);
    }
  }, [renderOnionAndCapture]);

  const exportBoth = useCallback(async (
    props: ExportSnapshotDOMProps,
    format: FormatType
  ): Promise<{ snapshotSuccess: boolean; cashflowSuccess: boolean }> => {
    setExporting(true);
    try {
      const snapshotResult = await renderAndCapture(props, format, 'snapshot');
      return {
        snapshotSuccess: snapshotResult.success,
        cashflowSuccess: true,
      };
    } finally {
      setExporting(false);
    }
  }, [renderAndCapture]);

  return {
    exporting,
    exportSnapshot,
    exportOnion,
    exportBoth,
    renderAndCapture,
  };
};

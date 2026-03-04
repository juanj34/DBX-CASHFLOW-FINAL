import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type FormatType = 'png' | 'pdf';

interface UseClientExportProps {
  contentRef: React.RefObject<HTMLElement>;
  projectName?: string;
  clientName?: string;
  unit?: string;
}

interface ExportOptions {
  format: FormatType;
  viewName: string;
  targetWidth?: number;
}

/** Remove characters illegal in Windows/macOS filenames, collapse whitespace. */
function sanitizeFilename(str: string): string {
  return str.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Build a descriptive export filename.
 * Pattern: "{ClientName} - {ProjectName} Unit {Unit} - {ViewLabel}.ext"
 */
function buildFilename(
  parts: { clientName?: string; projectName?: string; unit?: string },
  viewName: string,
  extension: string,
): string {
  const segments: string[] = [];

  if (parts.clientName) segments.push(parts.clientName);

  let projectSegment = parts.projectName || 'Investment';
  if (parts.unit) projectSegment += ` Unit ${parts.unit}`;
  segments.push(projectSegment);

  // "cashflow-statement" → "Cashflow Statement"
  const humanView = viewName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  segments.push(humanView);

  return `${sanitizeFilename(segments.join(' - '))}.${extension}`;
}

export const useClientExport = ({ contentRef, projectName, clientName, unit }: UseClientExportProps) => {
  const [exporting, setExporting] = useState(false);

  const getBackgroundColor = useCallback((element: HTMLElement): string => {
    const computedBg = getComputedStyle(element).backgroundColor;
    if (computedBg === 'transparent' || computedBg === 'rgba(0, 0, 0, 0)') {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      if (bodyBg === 'transparent' || bodyBg === 'rgba(0, 0, 0, 0)') {
        return document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff';
      }
      return bodyBg;
    }
    return computedBg;
  }, []);

  const captureElement = useCallback(async (targetWidth?: number): Promise<HTMLCanvasElement | null> => {
    if (!contentRef.current) {
      console.error('Content ref is not available');
      return null;
    }

    document.body.classList.add('export-mode');

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    if (contentRef.current) {
      void contentRef.current.offsetHeight;
    }

    const backgroundColor = getBackgroundColor(contentRef.current);
    const captureWidth = targetWidth || contentRef.current.scrollWidth;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: captureWidth,
        height: contentRef.current.scrollHeight,
        windowWidth: captureWidth,
        windowHeight: contentRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          let css = `
            *, *::before, *::after {
              animation: none !important;
              animation-delay: 0s !important;
              animation-duration: 0s !important;
              transition: none !important;
              transition-delay: 0s !important;
              transition-duration: 0s !important;
              caret-color: transparent !important;
            }
            [style*="transform"],
            [class*="motion"],
            [data-framer-name],
            .framer-motion {
              transform: none !important;
            }
          `;

          // When a target width is set, constrain the export container
          if (targetWidth) {
            css += `
              [data-export-container] {
                max-width: ${targetWidth}px !important;
                width: ${targetWidth}px !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              [data-export-container] > div {
                max-width: none !important;
              }
            `;
          }

          style.innerHTML = css;
          clonedDoc.head.appendChild(style);

          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedTransform = getComputedStyle(el).transform;
              if (computedTransform && computedTransform !== 'none') {
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

  const exportImage = useCallback(async (viewName: string, targetWidth?: number): Promise<boolean> => {
    const canvas = await captureElement(targetWidth);
    if (!canvas) return false;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = buildFilename({ clientName, projectName, unit }, viewName, 'png');
          downloadBlob(blob, filename);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 'image/png', 1.0);
    });
  }, [captureElement, clientName, projectName, unit, downloadBlob]);

  const exportPdf = useCallback(async (viewName: string, targetWidth?: number): Promise<boolean> => {
    const canvas = await captureElement(targetWidth);
    if (!canvas) return false;

    try {
      // A4 landscape dimensions in mm
      const A4_W = 297;
      const A4_H = 210;
      const MARGIN = 10;
      const printW = A4_W - 2 * MARGIN;
      const printH = A4_H - 2 * MARGIN;

      // Source dimensions at actual pixels (canvas is 2x from html2canvas scale)
      const pxToMm = 25.4 / 96;
      const contentWMm = (canvas.width / 2) * pxToMm;
      const contentHMm = (canvas.height / 2) * pxToMm;

      // Scale to fit printable width (never upscale)
      const scale = Math.min(printW / contentWMm, 1);
      const imgW = contentWMm * scale;
      const imgH = contentHMm * scale;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      if (imgH <= printH) {
        // Single page — center horizontally
        const xOff = MARGIN + (printW - imgW) / 2;
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.90),
          'JPEG', xOff, MARGIN, imgW, imgH,
        );
      } else {
        // Multi-page: slice the canvas into page-height chunks
        const pageContentHMm = printH / scale;
        const pageContentHPx = (pageContentHMm / pxToMm) * 2; // canvas pixels (2x)
        const totalPages = Math.ceil(canvas.height / pageContentHPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage('a4', 'landscape');

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          const sliceH = Math.min(pageContentHPx, canvas.height - page * pageContentHPx);
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(
            canvas,
            0, page * pageContentHPx,
            canvas.width, sliceH,
            0, 0,
            canvas.width, sliceH,
          );

          const sliceImgH = (sliceH / 2) * pxToMm * scale;
          const xOff = MARGIN + (printW - imgW) / 2;
          pdf.addImage(
            sliceCanvas.toDataURL('image/jpeg', 0.90),
            'JPEG', xOff, MARGIN, imgW, sliceImgH,
          );
        }
      }

      const filename = buildFilename({ clientName, projectName, unit }, viewName, 'pdf');
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      return false;
    }
  }, [captureElement, clientName, projectName, unit]);

  const exportView = useCallback(async ({ format, viewName, targetWidth }: ExportOptions): Promise<boolean> => {
    setExporting(true);
    try {
      const success = format === 'pdf'
        ? await exportPdf(viewName, targetWidth)
        : await exportImage(viewName, targetWidth);
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
      const firstView = currentView;
      const secondView = currentView === 'cashflow' ? 'snapshot' : 'cashflow';

      const firstSuccess = format === 'pdf'
        ? await exportPdf(firstView)
        : await exportImage(firstView);

      onViewChange(secondView);
      await new Promise(resolve => setTimeout(resolve, 500));

      const secondSuccess = format === 'pdf'
        ? await exportPdf(secondView)
        : await exportImage(secondView);

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

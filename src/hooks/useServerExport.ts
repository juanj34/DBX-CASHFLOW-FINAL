import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type FormatType = 'png' | 'pdf';
type ViewType = 'snapshot' | 'cashflow';

interface ExportOptions {
  shareToken: string;
  format: FormatType;
  view: ViewType;
  projectName?: string;
}

interface ExportResult {
  success: boolean;
  error?: string;
}

export const useServerExport = () => {
  const [exporting, setExporting] = useState(false);

  const downloadBlob = useCallback((base64: string, format: FormatType, filename: string) => {
    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
    const blob = new Blob([byteArray], { type: mimeType });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportView = useCallback(async ({
    shareToken,
    format,
    view,
    projectName,
  }: ExportOptions): Promise<ExportResult> => {
    setExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
        body: {
          shareToken,
          format,
          view,
        },
      });

      if (error) {
        console.error('Server export error:', error);
        return { success: false, error: error.message || 'Export failed' };
      }

      if (!data?.data) {
        console.error('No data returned from export');
        return { success: false, error: 'No data returned from export service' };
      }

      // Generate filename
      const extension = format === 'pdf' ? 'pdf' : 'png';
      const filename = `${projectName || 'investment'}-${view}.${extension}`;

      // Download the file
      downloadBlob(data.data, format, filename);

      return { success: true };
    } catch (err) {
      console.error('Export error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Export failed' };
    } finally {
      setExporting(false);
    }
  }, [downloadBlob]);

  const exportBothViews = useCallback(async ({
    shareToken,
    format,
    projectName,
  }: Omit<ExportOptions, 'view'>): Promise<{ cashflowSuccess: boolean; snapshotSuccess: boolean }> => {
    setExporting(true);

    try {
      // Export both views sequentially (server-side is slower, parallel might timeout)
      const cashflowResult = await exportView({
        shareToken,
        format,
        view: 'cashflow',
        projectName,
      });

      const snapshotResult = await exportView({
        shareToken,
        format,
        view: 'snapshot',
        projectName,
      });

      return {
        cashflowSuccess: cashflowResult.success,
        snapshotSuccess: snapshotResult.success,
      };
    } finally {
      setExporting(false);
    }
  }, [exportView]);

  return {
    exporting,
    exportView,
    exportBothViews,
  };
};

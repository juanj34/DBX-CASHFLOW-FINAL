import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseSnapshotExportProps {
  shareToken?: string | null;
  projectName?: string;
}

export const useSnapshotExport = ({ shareToken, projectName }: UseSnapshotExportProps) => {
  const [exportingImage, setExportingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportImage = useCallback(async () => {
    if (!shareToken) {
      toast({
        title: 'Cannot export',
        description: 'Please save the quote first to enable export.',
        variant: 'destructive',
      });
      return;
    }

    setExportingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
        body: { shareToken, format: 'png' },
      });

      if (error) throw error;

      if (!data?.data) {
        throw new Error('No image data received');
      }

      // Convert base64 to blob
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'snapshot'}-investment-snapshot.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Image exported',
        description: 'Your snapshot image has been downloaded.',
      });
    } catch (err) {
      console.error('Export image error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExportingImage(false);
    }
  }, [shareToken, projectName]);

  const exportPdf = useCallback(async () => {
    if (!shareToken) {
      toast({
        title: 'Cannot export',
        description: 'Please save the quote first to enable export.',
        variant: 'destructive',
      });
      return;
    }

    setExportingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
        body: { shareToken, format: 'pdf' },
      });

      if (error) throw error;

      if (!data?.data) {
        throw new Error('No PDF data received');
      }

      // Convert base64 to blob
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'snapshot'}-investment-snapshot.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF exported',
        description: 'Your snapshot PDF has been downloaded.',
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExportingPdf(false);
    }
  }, [shareToken, projectName]);

  return {
    exportImage,
    exportPdf,
    exportingImage,
    exportingPdf,
  };
};

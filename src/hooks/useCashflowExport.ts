import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseCashflowExportProps {
  shareToken?: string | null;
  projectName?: string;
  activeView: 'cashflow' | 'snapshot';
  quoteId?: string;
  generateShareToken?: (quoteId: string) => Promise<string | null>;
  onTokenGenerated?: (token: string) => void;
}

export const useCashflowExport = ({ 
  shareToken, 
  projectName, 
  activeView,
  quoteId,
  generateShareToken,
  onTokenGenerated,
}: UseCashflowExportProps) => {
  const [exportingImage, setExportingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportImage = useCallback(async () => {
    let token = shareToken;
    
    // Auto-generate token if not present
    if (!token && quoteId && generateShareToken) {
      toast({
        title: 'Preparing export...',
        description: 'Generating share link first.',
      });
      token = await generateShareToken(quoteId);
      if (token) {
        onTokenGenerated?.(token);
      }
    }
    
    if (!token) {
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
        body: { shareToken: token, format: 'png', view: activeView },
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
      const viewLabel = activeView === 'snapshot' ? 'snapshot' : 'cashflow';
      link.download = `${projectName || 'investment'}-${viewLabel}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Image exported',
        description: `Your ${activeView} image has been downloaded.`,
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
  }, [shareToken, projectName, activeView, quoteId, generateShareToken, onTokenGenerated]);

  const exportPdf = useCallback(async () => {
    let token = shareToken;
    
    // Auto-generate token if not present
    if (!token && quoteId && generateShareToken) {
      toast({
        title: 'Preparing export...',
        description: 'Generating share link first.',
      });
      token = await generateShareToken(quoteId);
      if (token) {
        onTokenGenerated?.(token);
      }
    }
    
    if (!token) {
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
        body: { shareToken: token, format: 'pdf', view: activeView },
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
      const viewLabel = activeView === 'snapshot' ? 'snapshot' : 'cashflow';
      link.download = `${projectName || 'investment'}-${viewLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF exported',
        description: `Your ${activeView} PDF has been downloaded.`,
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
  }, [shareToken, projectName, activeView, quoteId, generateShareToken, onTokenGenerated]);

  return {
    exportImage,
    exportPdf,
    exportingImage,
    exportingPdf,
  };
};

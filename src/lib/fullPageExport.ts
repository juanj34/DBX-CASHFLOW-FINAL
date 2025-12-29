import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';

export const exportPageAsPng = async (
  containerSelector: string,
  filename: string,
  onStart?: () => void,
  onComplete?: () => void
): Promise<void> => {
  try {
    onStart?.();
    
    // Add export mode class to body
    document.body.classList.add('export-mode');
    
    // Wait for collapsible sections to expand
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) {
      throw new Error('Container not found');
    }

    // Capture the container
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image');
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      document.body.classList.remove('export-mode');
      onComplete?.();
    }, 'image/png', 1.0);
    
  } catch (error) {
    document.body.classList.remove('export-mode');
    onComplete?.();
    console.error('Export failed:', error);
    toast({
      title: 'Export failed',
      description: 'Could not generate the image. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

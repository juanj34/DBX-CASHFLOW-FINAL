import { useState, useCallback } from 'react';
import { Download, FileImage, FileText, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewType = 'cashflow' | 'snapshot' | 'both';
type FormatType = 'png' | 'pdf';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken?: string | null;
  quoteId?: string;
  projectName?: string;
  activeView?: 'cashflow' | 'snapshot';
  generateShareToken?: (quoteId: string) => Promise<string | null>;
  onTokenGenerated?: (token: string) => void;
}

export const ExportModal = ({
  open,
  onOpenChange,
  shareToken,
  quoteId,
  projectName,
  activeView = 'cashflow',
  generateShareToken,
  onTokenGenerated,
}: ExportModalProps) => {
  const [viewType, setViewType] = useState<ViewType>(activeView);
  const [format, setFormat] = useState<FormatType>('png');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });

  // Reset to current active view when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setViewType(activeView);
      setProgress({ current: 0, total: 0, label: '' });
    }
    onOpenChange(isOpen);
  };

  const exportSingleView = useCallback(async (
    view: 'cashflow' | 'snapshot', 
    exportFormat: FormatType,
    token: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
        body: { shareToken: token, format: exportFormat, view },
      });

      if (error) throw error;
      if (!data?.data) throw new Error('No data received');

      // Convert base64 to blob
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const mimeType = exportFormat === 'pdf' ? 'application/pdf' : 'image/png';
      const blob = new Blob([bytes], { type: mimeType });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'investment'}-${view}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error(`Export ${view} error:`, err);
      return false;
    }
  }, [projectName]);

  const handleExport = useCallback(async () => {
    let token = shareToken;

    // Auto-generate token if not present
    if (!token && quoteId && generateShareToken) {
      setProgress({ current: 0, total: 1, label: 'Preparing export...' });
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

    setExporting(true);

    try {
      if (viewType === 'both') {
        // Export both views sequentially
        setProgress({ current: 1, total: 2, label: 'Generating Cashflow...' });
        const cashflowSuccess = await exportSingleView('cashflow', format, token);

        setProgress({ current: 2, total: 2, label: 'Generating Snapshot...' });
        const snapshotSuccess = await exportSingleView('snapshot', format, token);

        if (cashflowSuccess && snapshotSuccess) {
          toast({
            title: 'Export complete',
            description: `Both views have been downloaded as ${format.toUpperCase()}.`,
          });
        } else if (cashflowSuccess || snapshotSuccess) {
          toast({
            title: 'Partial export',
            description: 'One of the exports failed. Please try again.',
            variant: 'destructive',
          });
        } else {
          throw new Error('Both exports failed');
        }
      } else {
        // Export single view
        setProgress({ current: 1, total: 1, label: `Generating ${viewType}...` });
        const success = await exportSingleView(viewType, format, token);

        if (success) {
          toast({
            title: 'Export complete',
            description: `Your ${viewType} ${format.toUpperCase()} has been downloaded.`,
          });
        } else {
          throw new Error('Export failed');
        }
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate the export. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
      setProgress({ current: 0, total: 0, label: '' });
    }
  }, [shareToken, quoteId, generateShareToken, onTokenGenerated, viewType, format, exportSingleView, onOpenChange]);

  const viewOptions = [
    { value: 'cashflow', label: 'Cashflow', description: 'Full analysis view' },
    { value: 'snapshot', label: 'Snapshot', description: 'Compact summary' },
    { value: 'both', label: 'Both', description: 'Export both views' },
  ];

  const formatOptions = [
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Image file' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Document file' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-theme-card border-theme-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <Download className="w-5 h-5 text-theme-accent" />
            Export Quote
          </DialogTitle>
          <DialogDescription className="text-theme-text-muted">
            Choose what to export and the file format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* View Selection */}
          <div className="space-y-3">
            <Label className="text-theme-text font-medium">What to export</Label>
            <RadioGroup
              value={viewType}
              onValueChange={(value) => setViewType(value as ViewType)}
              className="grid grid-cols-3 gap-2"
              disabled={exporting}
            >
              {viewOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`view-${option.value}`}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all",
                    viewType === option.value
                      ? "border-theme-accent bg-theme-accent/10 text-theme-accent"
                      : "border-theme-border bg-theme-bg/50 text-theme-text-muted hover:border-theme-text-muted/50",
                    exporting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`view-${option.value}`}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-[10px] opacity-70">{option.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-theme-text font-medium">Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as FormatType)}
              className="grid grid-cols-2 gap-2"
              disabled={exporting}
            >
              {formatOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`format-${option.value}`}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                    format === option.value
                      ? "border-theme-accent bg-theme-accent/10 text-theme-accent"
                      : "border-theme-border bg-theme-bg/50 text-theme-text-muted hover:border-theme-text-muted/50",
                    exporting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`format-${option.value}`}
                    className="sr-only"
                  />
                  <option.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Progress State */}
          {exporting && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-theme-text-muted">{progress.label}</span>
                <span className="text-theme-accent font-medium">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <Progress 
                value={(progress.current / progress.total) * 100} 
                className="h-2 bg-theme-bg"
              />
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={exporting || !quoteId}
            className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-medium"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {viewType === 'both' ? 'Both' : viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </>
            )}
          </Button>

          {!quoteId && (
            <p className="text-xs text-center text-amber-400">
              Save the quote first to enable export
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

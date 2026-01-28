import { useState, useCallback } from 'react';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useExportRenderer } from '@/hooks/useExportRenderer';
import { downloadSnapshotPDF } from '@/lib/pdfGenerator';
import { OIInputs, OICalculations } from './useOICalculations';
import { MortgageInputs, MortgageAnalysis } from './useMortgageCalculations';
import { Currency } from './currencyUtils';
import { ClientUnitData } from './ClientUnitInfo';

type FormatType = 'png' | 'pdf';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  activeView?: 'cashflow' | 'snapshot';
  // Legacy props (for backward compatibility with OICalculator)
  quoteId?: string;
  mainContentRef?: React.RefObject<HTMLDivElement>;
  onViewChange?: (view: 'cashflow' | 'snapshot') => void;
  // Data for export DOM (new approach)
  inputs?: OIInputs;
  calculations?: OICalculations;
  clientInfo?: ClientUnitData;
  mortgageInputs?: MortgageInputs;
  mortgageAnalysis?: MortgageAnalysis;
  exitScenarios?: number[];
  currency?: Currency;
  rate?: number;
  language?: 'en' | 'es';
}

export const ExportModal = ({
  open,
  onOpenChange,
  projectName,
  activeView = 'snapshot',
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios = [],
  currency = 'AED',
  rate = 1,
  language = 'en',
}: ExportModalProps) => {
  const [format, setFormat] = useState<FormatType>('pdf');
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });

  const { exporting: exportingPNG, exportSnapshot } = useExportRenderer({
    projectName,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const exporting = exportingPNG || exportingPDF;

  // Check if we have all required data for export
  const hasExportData = inputs && calculations && clientInfo && mortgageInputs && mortgageAnalysis;

  // Reset to current active view when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setProgress({ current: 0, total: 0, label: '' });
    }
    onOpenChange(isOpen);
  };

  const handleExport = useCallback(async () => {
    if (!hasExportData) {
      toast({
        title: 'Cannot export',
        description: 'Export data not available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Close modal before capturing
    onOpenChange(false);
    
    // Small delay to let modal close
    await new Promise(resolve => setTimeout(resolve, 200));

    toast({
      title: 'Preparing export...',
      description: 'Generating your document. This may take a few seconds.',
    });

    try {
      setProgress({ current: 1, total: 1, label: `Generating snapshot...` });

      if (format === 'pdf') {
        // Use new jsPDF generator for PDF
        setExportingPDF(true);
        
        const result = await downloadSnapshotPDF({
          inputs: inputs!,
          calculations: calculations!,
          clientInfo: clientInfo!,
          mortgageInputs: mortgageInputs!,
          mortgageAnalysis: mortgageAnalysis!,
          exitScenarios,
          currency,
          rate,
          language,
          projectName: projectName || clientInfo?.projectName,
        });

        setExportingPDF(false);

        if (result.success) {
          toast({
            title: 'Export complete',
            description: 'Your PDF has been downloaded.',
          });
        } else {
          throw new Error(result.error || 'Export failed');
        }
      } else {
        // Use existing PNG exporter (html2canvas)
        const result = await exportSnapshot(
          {
            inputs: inputs!,
            calculations: calculations!,
            clientInfo: clientInfo!,
            mortgageInputs: mortgageInputs!,
            mortgageAnalysis: mortgageAnalysis!,
            exitScenarios,
            currency,
            rate,
            language,
          },
          format
        );

        if (result.success) {
          toast({
            title: 'Export complete',
            description: 'Your PNG has been downloaded.',
          });
        } else {
          throw new Error(result.error || 'Export failed');
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate the export. Please try again.',
        variant: 'destructive',
      });
      setExportingPDF(false);
    } finally {
      setProgress({ current: 0, total: 0, label: '' });
    }
  }, [hasExportData, format, inputs, calculations, clientInfo, mortgageInputs, mortgageAnalysis, exitScenarios, currency, rate, language, exportSnapshot, onOpenChange, projectName]);

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Professional document' },
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Image file' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-theme-card border-theme-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <Download className="w-5 h-5 text-theme-accent" />
            Export Investment Snapshot
          </DialogTitle>
          <DialogDescription className="text-theme-text-muted">
            Generate a professional PDF or image of your investment analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                    "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-4 cursor-pointer transition-all",
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
                  <option.icon className="w-6 h-6" />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] opacity-70">{option.description}</span>
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
            disabled={exporting || !hasExportData}
            className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-medium h-12"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>

          {!hasExportData && (
            <p className="text-xs text-center text-amber-400">
              Export data not available
            </p>
          )}

          {/* Info text */}
          <p className="text-xs text-center text-theme-text-muted">
            {format === 'pdf' 
              ? 'Creates a professional A4 landscape document'
              : 'Creates a high-resolution image for sharing'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

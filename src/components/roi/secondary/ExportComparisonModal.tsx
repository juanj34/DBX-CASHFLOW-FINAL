import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';

interface ExportComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'png' | 'pdf') => Promise<void>;
  isExporting: boolean;
  language: 'en' | 'es';
}

export const ExportComparisonModal = ({
  open,
  onOpenChange,
  onExport,
  isExporting,
  language,
}: ExportComparisonModalProps) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('pdf');

  const t = language === 'es' ? {
    title: 'Exportar Comparación',
    subtitle: 'Selecciona el formato de exportación',
    pdfLabel: 'PDF',
    pdfDesc: 'Ideal para compartir e imprimir',
    pngLabel: 'PNG',
    pngDesc: 'Imagen de alta resolución',
    export: 'Exportar',
    exporting: 'Exportando...',
    cancel: 'Cancelar',
  } : {
    title: 'Export Comparison',
    subtitle: 'Select export format',
    pdfLabel: 'PDF',
    pdfDesc: 'Ideal for sharing and printing',
    pngLabel: 'PNG',
    pngDesc: 'High-resolution image',
    export: 'Export',
    exporting: 'Exporting...',
    cancel: 'Cancel',
  };

  const handleExport = async () => {
    await onExport(format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <Download className="w-5 h-5 text-theme-accent" />
            {t.title}
          </DialogTitle>
          <p className="text-sm text-theme-text-muted">{t.subtitle}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup 
            value={format} 
            onValueChange={(value) => setFormat(value as 'png' | 'pdf')}
            className="space-y-3"
          >
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                format === 'pdf' 
                  ? 'border-theme-accent bg-theme-accent/5' 
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
              onClick={() => setFormat('pdf')}
            >
              <RadioGroupItem value="pdf" id="pdf" className="border-theme-border" />
              <div className="flex-1">
                <Label htmlFor="pdf" className="text-theme-text font-medium cursor-pointer flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  {t.pdfLabel}
                </Label>
                <p className="text-xs text-theme-text-muted">{t.pdfDesc}</p>
              </div>
            </div>
            
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                format === 'png' 
                  ? 'border-theme-accent bg-theme-accent/5' 
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
              onClick={() => setFormat('png')}
            >
              <RadioGroupItem value="png" id="png" className="border-theme-border" />
              <div className="flex-1">
                <Label htmlFor="png" className="text-theme-text font-medium cursor-pointer flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-blue-500" />
                  {t.pngLabel}
                </Label>
                <p className="text-xs text-theme-text-muted">{t.pngDesc}</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-theme-border text-theme-text"
            disabled={isExporting}
          >
            {t.cancel}
          </Button>
          <Button 
            onClick={handleExport}
            className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.exporting}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t.export}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

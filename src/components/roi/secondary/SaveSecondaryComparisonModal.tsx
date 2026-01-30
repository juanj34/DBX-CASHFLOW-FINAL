import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface SaveSecondaryComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string) => void;
  isUpdating?: boolean;
  currentTitle?: string;
  language?: 'en' | 'es';
}

export const SaveSecondaryComparisonModal = ({
  open,
  onOpenChange,
  onSave,
  isUpdating = false,
  currentTitle = '',
  language = 'es',
}: SaveSecondaryComparisonModalProps) => {
  const [title, setTitle] = useState(currentTitle);

  const t = language === 'es' ? {
    saveTitle: 'Guardar Comparación',
    updateTitle: 'Actualizar Comparación',
    titleLabel: 'Título',
    titlePlaceholder: 'Ej: Marina vs Secondary 1.5M',
    save: 'Guardar',
    update: 'Actualizar',
    cancel: 'Cancelar',
  } : {
    saveTitle: 'Save Comparison',
    updateTitle: 'Update Comparison',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g., Marina vs Secondary 1.5M',
    save: 'Save',
    update: 'Update',
    cancel: 'Cancel',
  };

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-theme-card border-theme-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-text">
            {isUpdating ? t.updateTitle : t.saveTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-theme-text">{t.titleLabel}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="bg-theme-bg border-theme-border text-theme-text"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-theme-border text-theme-text"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-theme-accent text-theme-accent-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {isUpdating ? t.update : t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

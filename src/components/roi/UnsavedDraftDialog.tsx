import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Save, Trash2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UnsavedDraftDialogProps {
  open: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const UnsavedDraftDialog = ({
  open,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
}: UnsavedDraftDialogProps) => {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="bg-theme-card border-theme-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-theme-text">
            {t('unsavedDraft')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-theme-text-muted">
            {t('unsavedDraftMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            <X className="w-4 h-4 mr-2" />
            {t('keepEditing')}
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
            className="w-full sm:w-auto order-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('discardDraft')}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-theme-accent text-theme-bg hover:bg-theme-accent/90 order-1 sm:order-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t('saving') || 'Saving...' : t('saveAsDraft')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

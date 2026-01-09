import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSavedComparisons, SaveComparisonInput } from '@/hooks/useSavedComparisons';
import { useToast } from '@/hooks/use-toast';
import { InvestmentFocus } from '@/hooks/useRecommendationEngine';

interface SaveComparisonModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (id: string, title: string) => void;
  quoteIds: string[];
  investmentFocus: InvestmentFocus | null;
  showRecommendations: boolean;
  existingId?: string;
  existingTitle?: string;
  existingDescription?: string;
}

export const SaveComparisonModal = ({
  open,
  onClose,
  onSaved,
  quoteIds,
  investmentFocus,
  showRecommendations,
  existingId,
  existingTitle = '',
  existingDescription = '',
}: SaveComparisonModalProps) => {
  const [title, setTitle] = useState(existingTitle);
  const [description, setDescription] = useState(existingDescription);
  const [saving, setSaving] = useState(false);
  const { saveComparison, updateComparison } = useSavedComparisons();
  const { toast } = useToast();

  const isEditing = !!existingId;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (isEditing) {
      const { error } = await updateComparison(existingId, {
        title: title.trim(),
        description: description.trim() || undefined,
        quoteIds,
        investmentFocus,
        showRecommendations,
      });

      if (error) {
        toast({ title: 'Failed to update comparison', variant: 'destructive' });
      } else {
        toast({ title: 'Comparison updated!' });
        onSaved?.(existingId, title.trim());
        onClose();
      }
    } else {
      const input: SaveComparisonInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        quoteIds,
        investmentFocus,
        showRecommendations,
      };

      const { id, error } = await saveComparison(input);

      if (error) {
        toast({ title: 'Failed to save comparison', variant: 'destructive' });
      } else {
        toast({ title: 'Comparison saved!' });
        if (id) {
          onSaved?.(id, title.trim());
        }
        onClose();
      }
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-theme-accent" />
            {isEditing ? 'Update Comparison' : 'Save Comparison'}
          </DialogTitle>
          <DialogDescription className="text-theme-text-muted">
            {isEditing 
              ? 'Update your saved comparison details.'
              : 'Save this comparison to access it later or share with clients.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Downtown vs Marina comparison"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-theme-bg border-theme-border text-theme-text"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Notes about this comparison..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-theme-bg border-theme-border text-theme-text resize-none"
              rows={3}
            />
          </div>
          <div className="text-sm text-theme-text-muted">
            {quoteIds.length} quotes will be saved in this comparison
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-theme-border">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Save'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

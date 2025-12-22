import { Save, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SaveControlsProps {
  saving: boolean;
  lastSaved: Date | null;
  onSave: () => Promise<any>;
  onSaveAs: () => Promise<any>;
}

export const SaveControls = ({
  saving,
  lastSaved,
  onSave,
  onSaveAs,
}: SaveControlsProps) => {
  const { toast } = useToast();

  const handleSave = async () => {
    await onSave();
    toast({ title: 'Saved!' });
  };

  const handleSaveAs = async () => {
    const result = await onSaveAs();
    if (result) {
      toast({ title: 'Saved as new quote!' });
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const diff = Date.now() - lastSaved.getTime();
    if (diff < 60000) return 'Saved just now';
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save status indicator */}
      {saving ? (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      ) : lastSaved ? (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Check className="w-3 h-3 text-green-500" />
          {formatLastSaved()}
        </span>
      ) : null}

      {/* Save button */}
      <Button
        variant="outlineDark"
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save
      </Button>

      {/* More options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outlineDark"
            size="sm"
          >
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1a1f2e] border-[#2a3142]">
          <DropdownMenuItem
            onClick={handleSaveAs}
            className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] gap-2"
          >
            <Copy className="w-4 h-4" />
            Save as New
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

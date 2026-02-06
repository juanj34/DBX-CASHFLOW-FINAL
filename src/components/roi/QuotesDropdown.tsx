import { Save, Copy, FolderOpen, FileText, Check, Loader2, ChevronDown, FilePlus, History, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNewQuote } from '@/hooks/useNewQuote';

interface QuotesDropdownProps {
  saving: boolean;
  lastSaved: Date | null;
  onSave: () => Promise<any>;
  onSaveAs: () => Promise<any>;
  onLoadQuote: () => void;
  onNewQuote?: () => void;
  onViewHistory?: () => void;
  hasQuoteId?: boolean;
}

export const QuotesDropdown = ({
  saving,
  lastSaved,
  onSave,
  onSaveAs,
  onLoadQuote,
  onNewQuote,
  onViewHistory,
  hasQuoteId = false,
}: QuotesDropdownProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { startNewQuote } = useNewQuote();

  const handleSave = async () => {
    await onSave();
    toast({ title: t('save') + '!' });
  };

  const handleSaveAs = async () => {
    const result = await onSaveAs();
    if (result) {
      toast({ title: 'Saved as new quote!' });
    }
  };

  const handleNewQuote = async () => {
    if (onNewQuote) {
      // Use the callback provided by the parent (handles draft checks)
      onNewQuote();
    } else {
      // Use unified hook for consistent behavior across all entry points
      await startNewQuote({
        openConfigurator: true,
        targetRoute: 'generator',
      });
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outlineDark"
          size="sm"
          className="h-8 px-2 sm:px-3 gap-1.5"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">{t('quotes')}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-theme-card border-theme-border z-50 w-52"
      >
        {/* New Quote */}
        <DropdownMenuItem
          onClick={handleNewQuote}
          className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
        >
          <FilePlus className="w-4 h-4" />
          {t('newQuote')}
        </DropdownMenuItem>

        {/* Save as New */}
        <DropdownMenuItem
          onClick={handleSaveAs}
          disabled={saving}
          className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
        >
          <Copy className="w-4 h-4" />
          Save as New
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-theme-border" />

        {/* Load Quote */}
        <DropdownMenuItem
          onClick={onLoadQuote}
          className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          {t('loadQuote')}
        </DropdownMenuItem>

        {/* Compare Quotes */}
        <DropdownMenuItem
          onClick={() => navigate('/compare')}
          className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          Compare Quotes
        </DropdownMenuItem>

        {/* Version History - only show when editing existing quote */}
        {hasQuoteId && onViewHistory && (
          <DropdownMenuItem
            onClick={onViewHistory}
            className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
          >
            <History className="w-4 h-4" />
            {t('versionHistory')}
          </DropdownMenuItem>
        )}

        {/* Save status indicator */}
        {(saving || lastSaved) && (
          <>
            <DropdownMenuSeparator className="bg-theme-border" />
            <div className="px-2 py-1.5 text-xs text-theme-text-muted flex items-center gap-1.5">
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  {formatLastSaved()}
                </>
              ) : null}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

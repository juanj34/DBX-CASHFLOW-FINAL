import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSavedComparisons } from '@/hooks/useSavedComparisons';
import { useToast } from '@/hooks/use-toast';

interface ShareComparisonButtonProps {
  comparisonId?: string;
  shareToken?: string | null;
  title?: string;
  variant?: 'button' | 'dropdown';
}

export const ShareComparisonButton = ({
  comparisonId,
  shareToken: initialToken,
  title = 'Property Comparison',
  variant = 'button',
}: ShareComparisonButtonProps) => {
  const [shareToken, setShareToken] = useState(initialToken);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { generateShareToken } = useSavedComparisons();
  const { toast } = useToast();

  const shareUrl = shareToken 
    ? `${window.location.origin}/compare-view/${shareToken}`
    : null;

  const handleGenerateLink = async () => {
    if (!comparisonId) {
      toast({ title: 'Save the comparison first to share it', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    const { shareToken: newToken, error } = await generateShareToken(comparisonId);
    
    if (error) {
      toast({ title: 'Failed to generate share link', variant: 'destructive' });
    } else if (newToken) {
      setShareToken(newToken);
      toast({ title: 'Share link generated!' });
    }
    
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied to clipboard!' });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!shareUrl) return;
    
    const message = encodeURIComponent(
      `Check out this property comparison: ${title}\n\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (variant === 'dropdown') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center w-full px-2 py-1.5 text-sm text-theme-text hover:bg-theme-card-alt">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 bg-theme-card border-theme-border p-4"
          align="end"
          side="left"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-theme-text">
              <Share2 className="w-4 h-4 text-theme-accent" />
              Share Comparison
            </div>

            {!shareUrl ? (
              <Button
                onClick={handleGenerateLink}
                disabled={generating || !comparisonId}
                className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-theme-border text-theme-text hover:bg-theme-card-alt"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-theme-text-muted text-center">
                  Anyone with this link can view the comparison
                </p>
              </div>
            )}

            {!comparisonId && (
              <p className="text-xs text-amber-400">
                Save the comparison first to share it with clients
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 bg-theme-card border-theme-border p-4"
        align="end"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-text">
            <Share2 className="w-4 h-4 text-theme-accent" />
            Share Comparison
          </div>

          {!shareUrl ? (
            <Button
              onClick={handleGenerateLink}
              disabled={generating || !comparisonId}
              className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 border-theme-border text-theme-text hover:bg-theme-card-alt"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-theme-text-muted text-center">
                Anyone with this link can view the comparison
              </p>
            </div>
          )}

          {!comparisonId && (
            <p className="text-xs text-amber-400">
              Save the comparison first to share it with clients
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

import { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareIconButtonProps {
  quoteId: string;
  shareToken?: string | null;
  projectName?: string | null;
  clientEmail?: string | null;
  onShareGenerated?: (token: string) => void;
}

export const ShareIconButton = ({
  quoteId,
  shareToken,
  projectName,
  clientEmail,
  onShareGenerated
}: ShareIconButtonProps) => {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(shareToken);
  const { toast } = useToast();

  const generateShareToken = async () => {
    if (token) return token;
    
    setGenerating(true);
    const newToken = crypto.randomUUID().slice(0, 8);
    
    const { error } = await supabase
      .from('cashflow_quotes')
      .update({ share_token: newToken })
      .eq('id', quoteId);
    
    if (!error) {
      setToken(newToken);
      onShareGenerated?.(newToken);
    }
    setGenerating(false);
    return error ? null : newToken;
  };

  const handleCopyLink = async () => {
    const t = await generateShareToken();
    if (!t) return;
    
    await navigator.clipboard.writeText(`${window.location.origin}/view/${t}`);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    const t = await generateShareToken();
    if (!t) return;
    
    const url = `${window.location.origin}/view/${t}`;
    const message = `Check out this investment analysis: ${projectName || 'Property'}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = async () => {
    const t = await generateShareToken();
    if (!t) return;
    
    const url = `${window.location.origin}/view/${t}`;
    const subject = `Investment Analysis: ${projectName || 'Property'}`;
    const body = `Hi,\n\nHere is your personalized investment analysis:\n\n${url}`;
    window.open(`mailto:${clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <Popover>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Share with client</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <PopoverContent className="w-44 p-2" align="end">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            disabled={generating}
            className="w-full justify-start gap-2 text-theme-text hover:bg-theme-card-alt"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             copied ? <Check className="w-4 h-4 text-green-400" /> : 
             <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEmail}
            disabled={generating}
            className="w-full justify-start gap-2 text-theme-text hover:bg-theme-card-alt"
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWhatsApp}
            disabled={generating}
            className="w-full justify-start gap-2 text-green-400 hover:bg-green-500/10"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

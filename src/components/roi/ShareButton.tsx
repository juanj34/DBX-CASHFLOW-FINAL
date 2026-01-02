import { useState, useCallback } from 'react';
import { Share2, Copy, Mail, MessageCircle, Check, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface ShareButtonProps {
  quoteId?: string;
  shareToken?: string | null;
  clientName?: string;
  clientEmail?: string;
  projectName?: string;
  unitType?: string;
  advisorName?: string;
  advisorEmail?: string;
  viewCount?: number;
  firstViewedAt?: string | null;
  onGenerateShareUrl: () => Promise<string | null>;
  className?: string;
}

export const ShareButton = ({
  quoteId,
  shareToken,
  clientName,
  clientEmail,
  projectName,
  unitType,
  advisorName,
  advisorEmail,
  viewCount = 0,
  firstViewedAt,
  onGenerateShareUrl,
  className = '',
}: ShareButtonProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    shareToken ? `${window.location.origin}/view/${shareToken}` : null
  );

  const generateUrl = useCallback(async () => {
    if (shareUrl) return shareUrl;
    
    setGenerating(true);
    try {
      const url = await onGenerateShareUrl();
      if (url) {
        setShareUrl(url);
        return url;
      }
    } catch (error) {
      console.error('Error generating share URL:', error);
      toast({
        title: t('errorGeneratingLink') || 'Error generating link',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
    return null;
  }, [shareUrl, onGenerateShareUrl, toast, t]);

  const handleCopyLink = async () => {
    const url = await generateUrl();
    if (!url) return;
    
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: t('linkCopied') || 'Link copied!',
      description: t('linkCopiedDesc') || 'Share it with your client',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    const url = await generateUrl();
    if (!url) return;
    
    const message = `${t('checkOutProperty') || 'Check out this investment analysis for'}: ${projectName || 'your property'}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = async () => {
    const url = await generateUrl();
    if (!url) return;
    
    if (clientEmail) {
      setSendingEmail(true);
      try {
        const { error } = await supabase.functions.invoke('send-quote-email', {
          body: {
            clientName: clientName || 'Client',
            clientEmail,
            projectName: projectName || 'Investment Property',
            unitType: unitType || 'Unit',
            quoteUrl: url,
            advisorName: advisorName || 'Your Advisor',
            advisorEmail,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: t('emailSent') || 'Email sent!',
          description: t('emailSentDesc') || `Analysis sent to ${clientEmail}`,
        });
      } catch (error) {
        console.error('Error sending email:', error);
        toast({
          title: t('errorSendingEmail') || 'Error sending email',
          variant: 'destructive',
        });
      } finally {
        setSendingEmail(false);
      }
    } else {
      // Fallback to mailto if no client email
      const subject = encodeURIComponent(`Your Investment Analysis for ${projectName || 'Property'}`);
      const body = encodeURIComponent(`Hi,\n\nHere is your personalized investment analysis:\n\n${url}\n\nBest regards,\n${advisorName || 'Your Advisor'}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={`bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2 font-semibold ${className}`}
        >
          <Share2 className="w-4 h-4" />
          {t('share') || 'Share'}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3 bg-theme-card border-theme-border"
        align="end"
      >
        <div className="space-y-3">
          {/* Share Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={generating}
              className="w-full justify-start gap-2 border-theme-border text-theme-text hover:bg-theme-card-alt"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? t('copied') || 'Copied!' : t('copyLink') || 'Copy Link'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              disabled={generating || sendingEmail}
              className="w-full justify-start gap-2 border-theme-border text-theme-text hover:bg-theme-card-alt"
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {clientEmail ? t('sendEmail') || 'Send Email' : t('emailLink') || 'Email Link'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              disabled={generating}
              className="w-full justify-start gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>

          {/* Analytics */}
          {(viewCount > 0 || firstViewedAt) && (
            <>
              <div className="border-t border-theme-border pt-3">
                <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {viewCount} {viewCount === 1 ? t('view') || 'view' : t('views') || 'views'}
                    {firstViewedAt && (
                      <span className="ml-1">
                        • {t('firstOpened') || 'First opened'} {formatDate(firstViewedAt)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

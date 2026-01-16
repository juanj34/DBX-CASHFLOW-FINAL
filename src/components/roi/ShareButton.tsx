import { useState, useCallback } from 'react';
import { Share2, Copy, Mail, MessageCircle, Check, Eye, Loader2, Clock, MapPin, LayoutGrid, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuoteViews, formatDuration, getCountryFlag } from '@/hooks/useQuoteViews';
import { cn } from '@/lib/utils';

type ViewType = 'cashflow' | 'snapshot';

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
  lastViewedAt?: string | null;
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
  lastViewedAt,
  onGenerateShareUrl,
  className = '',
}: ShareButtonProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('cashflow');
  const [shareUrl, setShareUrl] = useState<string | null>(
    shareToken ? `${window.location.origin}/view/${shareToken}` : null
  );
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(
    shareToken ? `${window.location.origin}/snapshot/${shareToken}` : null
  );
  
  // Fetch detailed view analytics
  const { analytics, loading: loadingAnalytics } = useQuoteViews(quoteId);

  const generateUrl = useCallback(async () => {
    const currentUrl = viewType === 'cashflow' ? shareUrl : snapshotUrl;
    if (currentUrl) return currentUrl;
    
    setGenerating(true);
    try {
      const baseUrl = await onGenerateShareUrl();
      if (baseUrl) {
        // Extract token from /view/ URL and create both URLs
        const token = baseUrl.split('/view/')[1];
        if (token) {
          const cashflowUrl = `${window.location.origin}/view/${token}`;
          const snapUrl = `${window.location.origin}/snapshot/${token}`;
          setShareUrl(cashflowUrl);
          setSnapshotUrl(snapUrl);
          return viewType === 'cashflow' ? cashflowUrl : snapUrl;
        }
        setShareUrl(baseUrl);
        return baseUrl;
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
  }, [shareUrl, snapshotUrl, viewType, onGenerateShareUrl, toast, t]);

  const getCurrentUrl = useCallback(() => {
    return viewType === 'cashflow' ? shareUrl : snapshotUrl;
  }, [viewType, shareUrl, snapshotUrl]);

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

  // Use analytics if available, otherwise fall back to props
  const displayViewCount = analytics?.totalViews ?? viewCount;
  const displayLastViewed = analytics?.lastViewedAt ?? lastViewedAt;
  const displayFirstViewed = firstViewedAt;

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
        className="w-72 p-3 bg-theme-card border-theme-border"
        align="end"
      >
        <div className="space-y-3">
          {/* View Type Selector */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewType('cashflow')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewType === 'cashflow' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Cashflow
            </button>
            <button
              onClick={() => setViewType('snapshot')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewType === 'snapshot' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Snapshot
            </button>
          </div>

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

          {/* Enhanced Analytics */}
          {(displayViewCount > 0 || displayFirstViewed) && (
            <>
              <div className="border-t border-theme-border pt-3 space-y-2">
                {/* View count and avg time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {displayViewCount} {displayViewCount === 1 ? t('view') || 'view' : t('views') || 'views'}
                    </span>
                  </div>
                  {analytics?.averageDuration && (
                    <div className="flex items-center gap-1.5 text-xs text-theme-text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>avg {formatDuration(analytics.averageDuration)}</span>
                    </div>
                  )}
                </div>

                {/* Last viewed with location */}
                {displayLastViewed && (
                  <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                    <span className="text-theme-accent">●</span>
                    <span>
                      {t('lastViewed') || 'Last viewed'} {formatDate(displayLastViewed)}
                      {analytics?.lastViewLocation && (
                        <span className="ml-1">
                          {getCountryFlag(analytics.lastViewCountryCode)} {analytics.lastViewLocation}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* First opened */}
                {displayFirstViewed && (
                  <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                    <span>
                      {t('firstOpened') || 'First opened'} {formatDate(displayFirstViewed)}
                    </span>
                  </div>
                )}

                {/* Total time spent */}
                {analytics && analytics.totalTimeSpent > 60 && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {t('totalTimeSpent') || 'Total time spent'}: {formatDuration(analytics.totalTimeSpent)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Loading state for analytics */}
          {loadingAnalytics && displayViewCount === 0 && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-theme-text-muted" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
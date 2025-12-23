import { useState, useEffect } from 'react';
import { History, RotateCcw, Loader2, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuoteVersions, QuoteVersion } from '@/hooks/useQuoteVersions';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string | undefined;
  onRestore: () => void;
}

export const VersionHistoryModal = ({
  open,
  onOpenChange,
  quoteId,
  onRestore,
}: VersionHistoryModalProps) => {
  const { t } = useLanguage();
  const { versions, loading, fetchVersions, restoreVersion } = useQuoteVersions(quoteId);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<QuoteVersion | null>(null);

  useEffect(() => {
    if (open && quoteId) {
      fetchVersions();
    }
  }, [open, quoteId, fetchVersions]);

  const handleRestore = async (version: QuoteVersion) => {
    setRestoring(version.id);
    const result = await restoreVersion(version.id);
    setRestoring(null);
    setConfirmVersion(null);
    
    if (result) {
      onRestore();
      onOpenChange(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, yyyy \'at\' h:mm a');
  };

  const formatPrice = (inputs: Record<string, any>) => {
    const price = inputs?.basePrice || inputs?.purchasePrice;
    if (!price) return null;
    return `AED ${Number(price).toLocaleString()}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              {t('versionHistory')}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{t('noVersions')}</p>
                <p className="text-sm mt-1 opacity-70">
                  {t('versionsCreatedOnSave')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="bg-[#0f1219] border border-[#2a3142] rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={index === 0 ? "default" : "secondary"}
                            className={index === 0 
                              ? "bg-primary/20 text-primary border-primary/30" 
                              : "bg-[#2a3142] text-gray-300"
                            }
                          >
                            v{version.version_number}
                          </Badge>
                          {index === 0 && (
                            <span className="text-xs text-primary/80">
                              {t('latestVersion')}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.created_at)}
                        </div>
                        
                        <div className="text-sm text-gray-300 truncate">
                          {version.client_name && (
                            <span>{version.client_name}</span>
                          )}
                          {version.project_name && (
                            <span className="text-gray-500">
                              {version.client_name ? ' • ' : ''}
                              {version.project_name}
                            </span>
                          )}
                        </div>
                        
                        {formatPrice(version.inputs) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatPrice(version.inputs)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmVersion(version)}
                        disabled={restoring !== null}
                        className="shrink-0 border-[#2a3142] hover:border-primary hover:bg-primary/10"
                      >
                        {restoring === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            {t('restore')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmVersion} onOpenChange={() => setConfirmVersion(null)}>
        <AlertDialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmRestore')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('confirmRestoreDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#2a3142] hover:bg-[#2a3142]">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmVersion && handleRestore(confirmVersion)}
              className="bg-primary hover:bg-primary/90"
            >
              {t('restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

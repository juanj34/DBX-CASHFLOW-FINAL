import { useState } from 'react';
import { Eye, EyeOff, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface ViewVisibility {
  investmentSnapshot: boolean;
  rentSnapshot: boolean;
  paymentBreakdown: boolean;
  exitStrategy: boolean;
  longTermHold: boolean;
}

const DEFAULT_VISIBILITY: ViewVisibility = {
  investmentSnapshot: true,
  rentSnapshot: true,
  paymentBreakdown: true,
  exitStrategy: true,
  longTermHold: true,
};

interface ViewVisibilityControlsProps {
  shareUrl: string | null;
  onGenerateShareUrl: () => Promise<string | null>;
}

export const encodeVisibility = (visibility: ViewVisibility): string => {
  const bits = [
    visibility.investmentSnapshot ? '1' : '0',
    visibility.rentSnapshot ? '1' : '0',
    visibility.paymentBreakdown ? '1' : '0',
    visibility.exitStrategy ? '1' : '0',
    visibility.longTermHold ? '1' : '0',
  ].join('');
  return bits;
};

export const decodeVisibility = (encoded: string | null): ViewVisibility => {
  if (!encoded || encoded.length !== 5) return DEFAULT_VISIBILITY;
  return {
    investmentSnapshot: encoded[0] === '1',
    rentSnapshot: encoded[1] === '1',
    paymentBreakdown: encoded[2] === '1',
    exitStrategy: encoded[3] === '1',
    longTermHold: encoded[4] === '1',
  };
};

export const ViewVisibilityControls = ({ shareUrl, onGenerateShareUrl }: ViewVisibilityControlsProps) => {
  const { t } = useLanguage();
  const [visibility, setVisibility] = useState<ViewVisibility>(DEFAULT_VISIBILITY);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(shareUrl);

  const handleToggle = (key: keyof ViewVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    setGeneratedUrl(null); // Reset URL when visibility changes
  };

  const getShareUrlWithVisibility = (baseUrl: string): string => {
    const encoded = encodeVisibility(visibility);
    const url = new URL(baseUrl);
    url.searchParams.set('v', encoded);
    return url.toString();
  };

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const baseUrl = await onGenerateShareUrl();
      if (baseUrl) {
        const urlWithVisibility = getShareUrlWithVisibility(baseUrl);
        setGeneratedUrl(urlWithVisibility);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const visibilityOptions = [
    { key: 'investmentSnapshot' as const, label: t('investmentSnapshot') },
    { key: 'rentSnapshot' as const, label: t('rentSnapshot') },
    { key: 'paymentBreakdown' as const, label: t('paymentBreakdown') },
    { key: 'exitStrategy' as const, label: t('exitStrategyAnalysis') },
    { key: 'longTermHold' as const, label: t('longTermHoldAnalysis') },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('share')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#CCFF00]" />
            {t('customizeClientView')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-400">{t('selectSectionsToShow')}</p>
          
          <div className="space-y-3">
            {visibilityOptions.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={visibility[key]}
                  onCheckedChange={() => handleToggle(key)}
                  className="border-[#2a3142] data-[state=checked]:bg-[#CCFF00] data-[state=checked]:border-[#CCFF00]"
                />
                <label
                  htmlFor={key}
                  className="text-sm text-gray-300 cursor-pointer flex items-center gap-2"
                >
                  {visibility[key] ? (
                    <Eye className="w-4 h-4 text-[#CCFF00]" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                  {label}
                </label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#2a3142] space-y-3">
            {generatedUrl ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1 bg-[#0f172a] border border-[#2a3142] rounded-lg px-3 py-2 text-sm text-gray-300 truncate"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-[#CCFF00] text-[#CCFF00] hover:bg-[#CCFF00]/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGenerateLink}
                disabled={generating}
                className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/80"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('generateLink')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

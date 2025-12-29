import { useState, useEffect } from 'react';
import { Eye, EyeOff, Share2, Copy, Check, FileDown, Save, FolderOpen, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface ViewVisibility {
  investmentSnapshot: boolean;
  rentSnapshot: boolean;
  paymentBreakdown: boolean;
  exitStrategy: boolean;
  longTermHold: boolean;
  mortgage: boolean;
  showAppreciationBonus: boolean;
}

export interface VisibilityPreset {
  id: string;
  name: string;
  visibility: ViewVisibility;
}

const DEFAULT_VISIBILITY: ViewVisibility = {
  investmentSnapshot: true,
  rentSnapshot: true,
  paymentBreakdown: true,
  exitStrategy: true,
  longTermHold: true,
  mortgage: true,
  showAppreciationBonus: true,
};

// Built-in presets
const BUILT_IN_PRESETS: VisibilityPreset[] = [
  {
    id: 'full-analysis',
    name: 'Full Analysis',
    visibility: {
      investmentSnapshot: true,
      rentSnapshot: true,
      paymentBreakdown: true,
      exitStrategy: true,
      longTermHold: true,
      mortgage: true,
      showAppreciationBonus: true,
    }
  },
  {
    id: 'basic-view',
    name: 'Basic View',
    visibility: {
      investmentSnapshot: true,
      rentSnapshot: true,
      paymentBreakdown: true,
      exitStrategy: false,
      longTermHold: false,
      mortgage: false,
      showAppreciationBonus: false,
    }
  },
  {
    id: 'exit-focus',
    name: 'Exit Focus',
    visibility: {
      investmentSnapshot: true,
      rentSnapshot: false,
      paymentBreakdown: true,
      exitStrategy: true,
      longTermHold: false,
      mortgage: false,
      showAppreciationBonus: true,
    }
  },
  {
    id: 'hold-focus',
    name: 'Hold Strategy',
    visibility: {
      investmentSnapshot: true,
      rentSnapshot: true,
      paymentBreakdown: false,
      exitStrategy: false,
      longTermHold: true,
      mortgage: true,
      showAppreciationBonus: true,
    }
  },
];

const PRESETS_STORAGE_KEY = 'visibility_presets';

interface ViewVisibilityControlsProps {
  shareUrl: string | null;
  onGenerateShareUrl: () => Promise<string | null>;
  onExportPDF?: (visibility: ViewVisibility) => void;
  enabledSections?: {
    exitStrategy: boolean;
    longTermHold: boolean;
  };
}

export const encodeVisibility = (visibility: ViewVisibility): string => {
  const bits = [
    visibility.investmentSnapshot ? '1' : '0',
    visibility.rentSnapshot ? '1' : '0',
    visibility.paymentBreakdown ? '1' : '0',
    visibility.exitStrategy ? '1' : '0',
    visibility.longTermHold ? '1' : '0',
    visibility.mortgage ? '1' : '0',
    visibility.showAppreciationBonus ? '1' : '0',
  ].join('');
  return bits;
};

export const decodeVisibility = (encoded: string | null): ViewVisibility => {
  if (!encoded || encoded.length < 5) return DEFAULT_VISIBILITY;
  return {
    investmentSnapshot: encoded[0] === '1',
    rentSnapshot: encoded[1] === '1',
    paymentBreakdown: encoded[2] === '1',
    exitStrategy: encoded[3] === '1',
    longTermHold: encoded[4] === '1',
    mortgage: encoded.length > 5 ? encoded[5] === '1' : true,
    showAppreciationBonus: encoded.length > 6 ? encoded[6] === '1' : true,
  };
};

export const ViewVisibilityControls = ({ 
  shareUrl, 
  onGenerateShareUrl, 
  onExportPDF,
  enabledSections = { exitStrategy: true, longTermHold: true }
}: ViewVisibilityControlsProps) => {
  const { t } = useLanguage();
  const [visibility, setVisibility] = useState<ViewVisibility>(DEFAULT_VISIBILITY);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(shareUrl);
  
  // Presets state
  const [customPresets, setCustomPresets] = useState<VisibilityPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse visibility presets', e);
      }
    }
  }, []);

  // Save custom presets to localStorage
  const savePresetsToStorage = (presets: VisibilityPreset[]) => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    setCustomPresets(presets);
  };

  const handleToggle = (key: keyof ViewVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    setGeneratedUrl(null);
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

  const handleExportPDF = async () => {
    if (onExportPDF) {
      setExporting(true);
      try {
        await onExportPDF(visibility);
        toast.success(t('pdfExported'));
      } catch (error) {
        toast.error('Failed to export PDF');
      } finally {
        setExporting(false);
      }
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
      // Respect enabled sections - force disabled sections to false
      const adjustedVisibility = {
        ...preset.visibility,
        exitStrategy: enabledSections.exitStrategy ? preset.visibility.exitStrategy : false,
        longTermHold: enabledSections.longTermHold ? preset.visibility.longTermHold : false,
        rentSnapshot: enabledSections.longTermHold ? preset.visibility.rentSnapshot : false,
      };
      setVisibility(adjustedVisibility);
      setGeneratedUrl(null);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset: VisibilityPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      visibility: { ...visibility },
    };
    
    const updated = [...customPresets, newPreset];
    savePresetsToStorage(updated);
    setPresetName('');
    setShowSavePreset(false);
    toast.success(`Saved preset "${newPreset.name}"`);
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = customPresets.filter(p => p.id !== presetId);
    savePresetsToStorage(updated);
    toast.success('Preset deleted');
  };

  // Filter visibility options based on enabled sections
  const visibilityOptions = [
    { key: 'investmentSnapshot' as const, label: t('investmentSnapshot'), alwaysEnabled: true },
    { key: 'paymentBreakdown' as const, label: t('paymentBreakdown'), alwaysEnabled: true },
    { key: 'rentSnapshot' as const, label: t('rentSnapshot'), alwaysEnabled: false, requiresSection: 'longTermHold' as const },
    { key: 'exitStrategy' as const, label: t('exitStrategyAnalysis'), alwaysEnabled: false, requiresSection: 'exitStrategy' as const },
    { key: 'longTermHold' as const, label: t('longTermHoldAnalysis'), alwaysEnabled: false, requiresSection: 'longTermHold' as const },
    { key: 'mortgage' as const, label: t('mortgageBreakdown'), alwaysEnabled: true },
    { key: 'showAppreciationBonus' as const, label: t('appreciationBonus') || 'Appreciation %', alwaysEnabled: true },
  ].filter(option => {
    if (option.alwaysEnabled) return true;
    if (option.requiresSection === 'exitStrategy') return enabledSections.exitStrategy;
    if (option.requiresSection === 'longTermHold') return enabledSections.longTermHold;
    return true;
  });

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outlineDark"
          size="sm"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('share')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#CCFF00]" />
            {t('customizeClientView')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t('quickPresets') || 'Quick Presets'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
              >
                <Save className="w-3 h-3 mr-1" />
                {t('savePreset') || 'Save'}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {BUILT_IN_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="h-7 px-2.5 text-xs bg-[#0d1117] border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white hover:border-[#CCFF00]/50"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            
            {/* Custom presets */}
            {customPresets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customPresets.map(preset => (
                  <div key={preset.id} className="flex items-center gap-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset(preset.id)}
                      className="h-7 px-2.5 text-xs bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20"
                    >
                      {preset.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Save preset input */}
            {showSavePreset && (
              <div className="flex gap-2 pt-2">
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t('presetName') || 'Preset name...'}
                  className="h-8 bg-[#0d1117] border-[#2a3142] text-white text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                />
                <Button
                  size="sm"
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="h-8 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/80"
                >
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-[#2a3142] pt-4">
            <p className="text-sm text-gray-400 mb-3">{t('selectSectionsToShow')}</p>
            
            <div className="space-y-2.5">
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
          </div>

          <div className="pt-4 border-t border-[#2a3142] space-y-3">
            {/* Share Link Section */}
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
                  className="shrink-0 bg-[#0d1117] border-[#CCFF00] text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black"
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

            {/* Export PDF Button */}
            {onExportPDF && (
              <Button
                onClick={handleExportPDF}
                disabled={exporting}
                variant="outlineDark"
                className="w-full"
              >
                {exporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300" />
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    {t('exportPDF')}
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
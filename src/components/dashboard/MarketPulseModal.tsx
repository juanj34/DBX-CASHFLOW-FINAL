import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface MarketPulseModalProps {
  onUpdate?: () => void;
}

export const MarketPulseModal = ({ onUpdate }: MarketPulseModalProps) => {
  const { t } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [dubaiYield, setDubaiYield] = useState('6.8');
  const [mortgageRate, setMortgageRate] = useState('4.5');
  const [topArea, setTopArea] = useState('Rashid Yachts & Marina');

  useEffect(() => {
    if (profile) {
      setDubaiYield(String(profile.market_dubai_yield || 6.8));
      setMortgageRate(String(profile.market_mortgage_rate || 4.5));
      setTopArea(profile.market_top_area || 'Rashid Yachts & Marina');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      market_dubai_yield: parseFloat(dubaiYield) || 6.8,
      market_mortgage_rate: parseFloat(mortgageRate) || 4.5,
      market_top_area: topArea || 'Rashid Yachts & Marina',
    });
    
    if (error) {
      toast({ title: t('saveFailed'), variant: 'destructive' });
    } else {
      toast({ title: t('saved') });
      onUpdate?.();
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-theme-card border-theme-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-text">{t('marketPulseSettings')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm text-theme-text-muted mb-2">{t('dubaiYield')} (%)</label>
            <Input
              type="number"
              step="0.1"
              value={dubaiYield}
              onChange={(e) => setDubaiYield(e.target.value)}
              className="bg-theme-bg-alt border-theme-border text-theme-text"
            />
          </div>
          
          <div>
            <label className="block text-sm text-theme-text-muted mb-2">{t('mortgageRates')} (%)</label>
            <Input
              type="number"
              step="0.1"
              value={mortgageRate}
              onChange={(e) => setMortgageRate(e.target.value)}
              className="bg-theme-bg-alt border-theme-border text-theme-text"
            />
          </div>
          
          <div>
            <label className="block text-sm text-theme-text-muted mb-2">{t('topArea')}</label>
            <Input
              type="text"
              value={topArea}
              onChange={(e) => setTopArea(e.target.value)}
              placeholder="Rashid Yachts & Marina"
              className="bg-theme-bg-alt border-theme-border text-theme-text"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-theme-border text-theme-text-muted">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketPulseModal;

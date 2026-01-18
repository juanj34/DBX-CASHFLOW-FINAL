import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Camera, Zap, Briefcase, Moon, Settings, TrendingUp, Info, Shield, Target, Gauge, Sliders, Check, Mail, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, PROFILE_AVATAR_CONFIG } from '@/lib/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeKey, THEMES } from '@/config/themes';
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Growth Profile Presets
const GROWTH_PRESETS = {
  conservative: {
    name: 'Conservative',
    nameEs: 'Conservador',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Lower risk, steady returns',
    descriptionEs: 'Menor riesgo, retornos estables',
    construction: 8,
    growth: 5,
    mature: 3,
    growthYears: 3,
  },
  balanced: {
    name: 'Balanced',
    nameEs: 'Balanceado',
    icon: Target,
    color: 'text-theme-accent',
    bgColor: 'bg-theme-accent/10',
    borderColor: 'border-theme-accent/30',
    description: 'Moderate risk/reward balance',
    descriptionEs: 'Balance moderado riesgo/retorno',
    construction: 12,
    growth: 8,
    mature: 4,
    growthYears: 5,
  },
  aggressive: {
    name: 'Aggressive',
    nameEs: 'Agresivo',
    icon: Gauge,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Higher risk, maximum upside',
    descriptionEs: 'Mayor riesgo, máximo potencial',
    construction: 15,
    growth: 10,
    mature: 5,
    growthYears: 7,
  },
  custom: {
    name: 'Custom',
    nameEs: 'Personalizado',
    icon: Sliders,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Define your own rates',
    descriptionEs: 'Define tus propias tasas',
    construction: 12,
    growth: 8,
    mature: 4,
    growthYears: 5,
  },
} as const;

type GrowthPresetKey = keyof typeof GROWTH_PRESETS;

const AccountSettings = () => {
  useDocumentTitle("Account Settings");
  const { profile, loading, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+971');
  const [commissionRate, setCommissionRate] = useState('2');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Growth projection defaults
  const [constructionAppreciation, setConstructionAppreciation] = useState(12);
  const [growthAppreciation, setGrowthAppreciation] = useState(8);
  const [matureAppreciation, setMatureAppreciation] = useState(4);
  const [growthPeriodYears, setGrowthPeriodYears] = useState(5);
  const [selectedPreset, setSelectedPreset] = useState<GrowthPresetKey>('balanced');

  // Detect which preset matches current values
  const detectPreset = (c: number, g: number, m: number, y: number): GrowthPresetKey => {
    for (const [key, preset] of Object.entries(GROWTH_PRESETS)) {
      if (key === 'custom') continue;
      if (preset.construction === c && preset.growth === g && preset.mature === m && preset.growthYears === y) {
        return key as GrowthPresetKey;
      }
    }
    return 'custom';
  };

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBusinessEmail(profile.business_email || '');
      setWhatsappNumber(profile.whatsapp_number || '');
      setWhatsappCountryCode(profile.whatsapp_country_code || '+971');
      setCommissionRate(String(profile.commission_rate ?? 2));
      // Growth projection defaults
      const c = profile.default_construction_appreciation ?? 12;
      const g = profile.default_growth_appreciation ?? 8;
      const m = profile.default_mature_appreciation ?? 4;
      const y = profile.default_growth_period_years ?? 5;
      setConstructionAppreciation(c);
      setGrowthAppreciation(g);
      setMatureAppreciation(m);
      setGrowthPeriodYears(y);
      setSelectedPreset(detectPreset(c, g, m, y));
    }
  }, [profile]);

  const handlePresetSelect = (key: GrowthPresetKey) => {
    setSelectedPreset(key);
    if (key !== 'custom') {
      const preset = GROWTH_PRESETS[key];
      setConstructionAppreciation(preset.construction);
      setGrowthAppreciation(preset.growth);
      setMatureAppreciation(preset.mature);
      setGrowthPeriodYears(preset.growthYears);
    }
  };

  // When sliders change, check if it still matches a preset
  const handleSliderChange = (setter: (v: number) => void, value: number, field: 'c' | 'g' | 'm' | 'y') => {
    setter(value);
    const newC = field === 'c' ? value : constructionAppreciation;
    const newG = field === 'g' ? value : growthAppreciation;
    const newM = field === 'm' ? value : matureAppreciation;
    const newY = field === 'y' ? value : growthPeriodYears;
    setSelectedPreset(detectPreset(newC, newG, newM, newY));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const optimized = await optimizeImage(file, PROFILE_AVATAR_CONFIG);
      const fileName = `${profile.id}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, optimized, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      toast({ title: 'Avatar updated!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ 
      full_name: fullName,
      business_email: businessEmail || null,
      whatsapp_number: whatsappNumber || null,
      whatsapp_country_code: whatsappCountryCode,
      commission_rate: parseFloat(commissionRate) || 2,
      // Growth projection defaults
      default_construction_appreciation: constructionAppreciation,
      default_growth_appreciation: growthAppreciation,
      default_mature_appreciation: matureAppreciation,
      default_growth_period_years: growthPeriodYears,
    });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (!profile) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <PageHeader
        title={t('accountSettingsTitle')}
        subtitle="Manage your profile and preferences"
        icon={<Settings className="w-5 h-5" />}
        backLink="/home"
        shortcuts={defaultShortcuts}
        actions={
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              {saving ? t('accountSaving') : t('accountSaveChanges')}
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {t('signOut')}
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-theme-card border-theme-border">
              <CardContent className="pt-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-theme-card-alt border-4 border-theme-accent/20">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-theme-text-muted" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 p-2 bg-theme-accent rounded-full hover:bg-theme-accent/90 transition-colors"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-theme-bg border-t-transparent" />
                      ) : (
                        <Camera className="w-4 h-4 text-theme-bg" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-theme-text-muted mt-2">{t('accountClickToUpload')}</p>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountFullName')}</label>
                    <Input
                      value={fullName || profile.full_name || ''}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('accountEnterFullName')}
                      className="bg-theme-bg-alt border-theme-border text-theme-text h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountEmail')}</label>
                    <Input
                      value={profile.email}
                      disabled
                      className="bg-theme-bg border-theme-border text-theme-text-muted h-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-theme-card border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-text flex items-center gap-2">
                  <Phone className="w-4 h-4 text-theme-accent" />
                  {language === 'es' ? 'Contacto' : 'Contact'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountBusinessEmail')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
                    <Input
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="your@business.com"
                      type="email"
                      className="bg-theme-bg-alt border-theme-border text-theme-text h-9 pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountWhatsApp')}</label>
                  <div className="flex gap-2">
                    <Input
                      value={whatsappCountryCode}
                      onChange={(e) => setWhatsappCountryCode(e.target.value)}
                      placeholder="+971"
                      className="bg-theme-bg-alt border-theme-border text-theme-text w-20 h-9"
                    />
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="501234567"
                      className="bg-theme-bg-alt border-theme-border text-theme-text flex-1 h-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Settings Card */}
            <Card className="bg-theme-card border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-theme-accent" />
                  {t('businessSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-xs text-theme-text-muted mb-1.5">{t('commissionRate')} (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="2"
                    className="bg-theme-bg-alt border-theme-border text-theme-text w-24 h-9"
                  />
                  <p className="text-xs text-theme-text-muted mt-1">{t('commissionRateDesc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-theme-card border-theme-border">
              <CardContent className="pt-4 space-y-2">
                <Link to="/my-quotes" className="block">
                  <Button variant="outlineDark" size="sm" className="w-full justify-start">
                    {t('accountViewGenerators')}
                  </Button>
                </Link>
                <Link to="/dashboard" className="block">
                  <Button variant="outlineDark" size="sm" className="w-full justify-start">
                    {t('accountAdminDashboard')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Growth Projections & Theme */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Growth Projection Profiles */}
            <Card className="bg-theme-card border-theme-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-theme-accent" />
                  <CardTitle className="text-lg font-semibold text-theme-text">
                    {language === 'es' ? 'Perfiles de Proyección' : 'Growth Projection Profiles'}
                  </CardTitle>
                </div>
                <CardDescription className="text-theme-text-muted">
                  {language === 'es' 
                    ? 'Selecciona un perfil predefinido o personaliza las tasas de apreciación para nuevas cotizaciones.'
                    : 'Select a preset profile or customize appreciation rates for new quotes.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.entries(GROWTH_PRESETS) as [GrowthPresetKey, typeof GROWTH_PRESETS[GrowthPresetKey]][]).map(([key, preset]) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handlePresetSelect(key)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected 
                            ? `${preset.borderColor} ${preset.bgColor}` 
                            : 'border-theme-border bg-theme-bg-alt hover:border-theme-border-alt'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className={`w-4 h-4 ${preset.color}`} />
                          </div>
                        )}
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? preset.color : 'text-theme-text-muted'}`} />
                        <div className={`text-sm font-medium ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                          {language === 'es' ? preset.nameEs : preset.name}
                        </div>
                        <div className="text-xs text-theme-text-muted mt-0.5">
                          {language === 'es' ? preset.descriptionEs : preset.description}
                        </div>
                        {key !== 'custom' && (
                          <div className="mt-2 pt-2 border-t border-theme-border/50">
                            <div className="text-[10px] font-mono text-theme-text-muted">
                              {preset.construction}% → {preset.growth}% → {preset.mature}%
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Sliders - Always visible but dimmed when not custom */}
                <div className={`space-y-5 p-4 rounded-xl border transition-all ${
                  selectedPreset === 'custom' 
                    ? 'bg-purple-500/5 border-purple-500/20' 
                    : 'bg-theme-bg-alt border-theme-border'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-text">
                      {language === 'es' ? 'Tasas Personalizadas' : 'Custom Rates'}
                    </span>
                    {selectedPreset !== 'custom' && (
                      <span className="text-xs text-theme-text-muted">
                        {language === 'es' ? 'Ajusta para cambiar a personalizado' : 'Adjust to switch to custom'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Construction Phase */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <label className="text-sm text-theme-text">
                            {language === 'es' ? 'Construcción' : 'Construction'}
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                                <p className="text-xs text-theme-text">
                                  {language === 'es' 
                                    ? 'Tasa de apreciación anual durante la construcción. Típicamente 8-15%.'
                                    : 'Annual appreciation rate during construction. Typically 8-15%.'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm text-orange-400 font-mono font-medium">{constructionAppreciation}%</span>
                      </div>
                      <Slider
                        value={[constructionAppreciation]}
                        onValueChange={([value]) => handleSliderChange(setConstructionAppreciation, value, 'c')}
                        min={5}
                        max={20}
                        step={1}
                        className="roi-slider-lime"
                      />
                    </div>

                    {/* Growth Phase */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <label className="text-sm text-theme-text">
                            {language === 'es' ? 'Crecimiento' : 'Growth'}
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                                <p className="text-xs text-theme-text">
                                  {language === 'es' 
                                    ? 'Tasa post-entrega mientras el área se desarrolla. Típicamente 5-12%.'
                                    : 'Post-handover rate while the area develops. Typically 5-12%.'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm text-green-400 font-mono font-medium">{growthAppreciation}%</span>
                      </div>
                      <Slider
                        value={[growthAppreciation]}
                        onValueChange={([value]) => handleSliderChange(setGrowthAppreciation, value, 'g')}
                        min={3}
                        max={15}
                        step={1}
                        className="roi-slider-lime"
                      />
                    </div>

                    {/* Growth Duration */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-theme-accent" />
                          <label className="text-sm text-theme-text">
                            {language === 'es' ? 'Duración Crecimiento' : 'Growth Duration'}
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                                <p className="text-xs text-theme-text">
                                  {language === 'es' 
                                    ? 'Años de crecimiento antes de la fase madura.'
                                    : 'Years of growth before mature phase.'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm text-theme-accent font-mono font-medium">
                          {growthPeriodYears} {language === 'es' ? 'años' : 'years'}
                        </span>
                      </div>
                      <Slider
                        value={[growthPeriodYears]}
                        onValueChange={([value]) => handleSliderChange(setGrowthPeriodYears, value, 'y')}
                        min={2}
                        max={10}
                        step={1}
                        className="roi-slider-lime"
                      />
                    </div>

                    {/* Mature Phase */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <label className="text-sm text-theme-text">
                            {language === 'es' ? 'Madurez' : 'Mature'}
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                                <p className="text-xs text-theme-text">
                                  {language === 'es' 
                                    ? 'Tasa a largo plazo. Típicamente 2-6%.'
                                    : 'Long-term rate. Typically 2-6%.'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm text-blue-400 font-mono font-medium">{matureAppreciation}%</span>
                      </div>
                      <Slider
                        value={[matureAppreciation]}
                        onValueChange={([value]) => handleSliderChange(setMatureAppreciation, value, 'm')}
                        min={1}
                        max={8}
                        step={1}
                        className="roi-slider-lime"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="pt-3 border-t border-theme-border">
                    <div className="flex items-center justify-center gap-3 text-sm font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-orange-400">{constructionAppreciation}%</span>
                      </div>
                      <span className="text-theme-text-muted">→</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-green-400">{growthAppreciation}%</span>
                        <span className="text-theme-text-muted text-xs">({growthPeriodYears}y)</span>
                      </div>
                      <span className="text-theme-text-muted">→</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-blue-400">{matureAppreciation}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card className="bg-theme-card border-theme-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-theme-text">
                  {t('themePreference')}
                </CardTitle>
                <CardDescription className="text-theme-text-muted">
                  {t('themePreferenceDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, config]) => {
                    const Icon = key === 'tech-dark' ? Zap : key === 'consultant' ? Briefcase : Moon;
                    const isSelected = theme === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center ${
                          isSelected 
                            ? 'border-theme-accent bg-theme-accent/10' 
                            : 'border-theme-border bg-theme-bg-alt hover:border-theme-border-alt'
                        }`}
                      >
                        <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                          {config.name}
                        </span>
                        {isSelected && (
                          <div className="mt-2">
                            <Check className="w-4 h-4 text-theme-accent" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;

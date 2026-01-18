import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Camera, Zap, Briefcase, Moon, Settings, Check, Mail, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GrowthPresetsSection, MortgageDefaultsSection, AirbnbDefaultsSection, DifferentiatorsManager } from '@/components/settings';

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

  // Mortgage defaults
  const [mortgageFinancingPercent, setMortgageFinancingPercent] = useState(60);
  const [mortgageInterestRate, setMortgageInterestRate] = useState(4.5);
  const [mortgageTermYears, setMortgageTermYears] = useState(25);
  const [mortgageProcessingFee, setMortgageProcessingFee] = useState(1);

  // Airbnb/STR defaults
  const [adr, setAdr] = useState(800);
  const [occupancyPercent, setOccupancyPercent] = useState(70);
  const [strExpensePercent, setStrExpensePercent] = useState(25);
  const [strManagementPercent, setStrManagementPercent] = useState(15);
  const [adrGrowthRate, setAdrGrowthRate] = useState(3);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBusinessEmail(profile.business_email || '');
      setWhatsappNumber(profile.whatsapp_number || '');
      setWhatsappCountryCode(profile.whatsapp_country_code || '+971');
      setCommissionRate(String(profile.commission_rate ?? 2));
      // Growth projection defaults
      setConstructionAppreciation(profile.default_construction_appreciation ?? 12);
      setGrowthAppreciation(profile.default_growth_appreciation ?? 8);
      setMatureAppreciation(profile.default_mature_appreciation ?? 4);
      setGrowthPeriodYears(profile.default_growth_period_years ?? 5);
      // Mortgage defaults
      setMortgageFinancingPercent(profile.default_mortgage_financing_percent ?? 60);
      setMortgageInterestRate(profile.default_mortgage_interest_rate ?? 4.5);
      setMortgageTermYears(profile.default_mortgage_term_years ?? 25);
      setMortgageProcessingFee(profile.default_mortgage_processing_fee ?? 1);
      // Airbnb defaults
      setAdr(profile.default_adr ?? 800);
      setOccupancyPercent(profile.default_occupancy_percent ?? 70);
      setStrExpensePercent(profile.default_str_expense_percent ?? 25);
      setStrManagementPercent(profile.default_str_management_percent ?? 15);
      setAdrGrowthRate(profile.default_adr_growth_rate ?? 3);
    }
  }, [profile]);

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
      // Mortgage defaults
      default_mortgage_financing_percent: mortgageFinancingPercent,
      default_mortgage_interest_rate: mortgageInterestRate,
      default_mortgage_term_years: mortgageTermYears,
      default_mortgage_processing_fee: mortgageProcessingFee,
      // Airbnb defaults
      default_adr: adr,
      default_occupancy_percent: occupancyPercent,
      default_str_expense_percent: strExpensePercent,
      default_str_management_percent: strManagementPercent,
      default_adr_growth_rate: adrGrowthRate,
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

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile & Contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-theme-card border-theme-border">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-theme-card-alt border-4 border-theme-accent/20">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountFullName')}</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-theme-bg-alt border-theme-border text-theme-text h-9" />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountEmail')}</label>
                    <Input value={profile.email} disabled className="bg-theme-bg border-theme-border text-theme-text-muted h-9" />
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
                    <Input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="your@business.com" type="email" className="bg-theme-bg-alt border-theme-border text-theme-text h-9 pl-9" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-theme-text-muted mb-1.5">{t('accountWhatsApp')}</label>
                  <div className="flex gap-2">
                    <Input value={whatsappCountryCode} onChange={(e) => setWhatsappCountryCode(e.target.value)} className="bg-theme-bg-alt border-theme-border text-theme-text w-20 h-9" />
                    <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="501234567" className="bg-theme-bg-alt border-theme-border text-theme-text flex-1 h-9" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Settings */}
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
                  <Input type="number" step="0.1" min="0" max="10" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="bg-theme-bg-alt border-theme-border text-theme-text w-24 h-9" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-theme-card border-theme-border">
              <CardContent className="pt-4 space-y-2">
                <Link to="/my-quotes" className="block">
                  <Button variant="outlineDark" size="sm" className="w-full justify-start">{t('accountViewGenerators')}</Button>
                </Link>
                <Link to="/dashboard" className="block">
                  <Button variant="outlineDark" size="sm" className="w-full justify-start">{t('accountAdminDashboard')}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Growth Projection Profiles */}
            <GrowthPresetsSection
              language={language as 'en' | 'es'}
              constructionAppreciation={constructionAppreciation}
              growthAppreciation={growthAppreciation}
              matureAppreciation={matureAppreciation}
              growthPeriodYears={growthPeriodYears}
              setConstructionAppreciation={setConstructionAppreciation}
              setGrowthAppreciation={setGrowthAppreciation}
              setMatureAppreciation={setMatureAppreciation}
              setGrowthPeriodYears={setGrowthPeriodYears}
            />

            {/* Mortgage & Airbnb Defaults Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MortgageDefaultsSection
                language={language as 'en' | 'es'}
                financingPercent={mortgageFinancingPercent}
                interestRate={mortgageInterestRate}
                termYears={mortgageTermYears}
                processingFee={mortgageProcessingFee}
                setFinancingPercent={setMortgageFinancingPercent}
                setInterestRate={setMortgageInterestRate}
                setTermYears={setMortgageTermYears}
                setProcessingFee={setMortgageProcessingFee}
              />
              <AirbnbDefaultsSection
                language={language as 'en' | 'es'}
                adr={adr}
                occupancyPercent={occupancyPercent}
                expensePercent={strExpensePercent}
                managementPercent={strManagementPercent}
                adrGrowthRate={adrGrowthRate}
                setAdr={setAdr}
                setOccupancyPercent={setOccupancyPercent}
                setExpensePercent={setStrExpensePercent}
                setManagementPercent={setStrManagementPercent}
                setAdrGrowthRate={setAdrGrowthRate}
              />
            </div>

            {/* Custom Value Differentiators */}
            <DifferentiatorsManager language={language as 'en' | 'es'} />

            {/* Theme Selection */}
            <Card className="bg-theme-card border-theme-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-theme-text">{t('themePreference')}</CardTitle>
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
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-theme-accent bg-theme-accent/10' : 'border-theme-border bg-theme-bg-alt hover:border-theme-border-alt'}`}
                      >
                        <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>{config.name}</span>
                        {isSelected && <div className="mt-2"><Check className="w-4 h-4 text-theme-accent" /></div>}
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

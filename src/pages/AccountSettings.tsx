import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Camera, Settings, Mail, Phone, Building2, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, PROFILE_AVATAR_CONFIG } from '@/lib/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GrowthPresetsSection, MortgageDefaultsSection, AirbnbDefaultsSection, DifferentiatorsManager } from '@/components/settings';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AccountSettings = () => {
  useDocumentTitle("Account Settings");
  const { profile, loading, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
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
  const [mortgageValuationFee, setMortgageValuationFee] = useState(3000);
  const [mortgageRegistrationPercent, setMortgageRegistrationPercent] = useState(0.25);
  const [mortgageLifeInsurancePercent, setMortgageLifeInsurancePercent] = useState(0.4);
  const [mortgagePropertyInsurance, setMortgagePropertyInsurance] = useState(1500);

  // Airbnb/STR defaults
  const [adr, setAdr] = useState(800);
  const [occupancyPercent, setOccupancyPercent] = useState(70);
  const [strExpensePercent, setStrExpensePercent] = useState(25);
  const [strManagementPercent, setStrManagementPercent] = useState(15);
  const [adrGrowthRate, setAdrGrowthRate] = useState(3);

  // Track if there are unsaved changes
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);

  // Check if current values differ from saved profile
  const hasUnsavedChanges = useMemo(() => {
    if (!profile || !initialValues) return false;
    return (
      fullName !== initialValues.fullName ||
      businessEmail !== initialValues.businessEmail ||
      whatsappNumber !== initialValues.whatsappNumber ||
      whatsappCountryCode !== initialValues.whatsappCountryCode ||
      commissionRate !== initialValues.commissionRate ||
      constructionAppreciation !== initialValues.constructionAppreciation ||
      growthAppreciation !== initialValues.growthAppreciation ||
      matureAppreciation !== initialValues.matureAppreciation ||
      growthPeriodYears !== initialValues.growthPeriodYears ||
      mortgageFinancingPercent !== initialValues.mortgageFinancingPercent ||
      mortgageInterestRate !== initialValues.mortgageInterestRate ||
      mortgageTermYears !== initialValues.mortgageTermYears ||
      mortgageProcessingFee !== initialValues.mortgageProcessingFee ||
      mortgageValuationFee !== initialValues.mortgageValuationFee ||
      mortgageRegistrationPercent !== initialValues.mortgageRegistrationPercent ||
      mortgageLifeInsurancePercent !== initialValues.mortgageLifeInsurancePercent ||
      mortgagePropertyInsurance !== initialValues.mortgagePropertyInsurance ||
      adr !== initialValues.adr ||
      occupancyPercent !== initialValues.occupancyPercent ||
      strExpensePercent !== initialValues.strExpensePercent ||
      strManagementPercent !== initialValues.strManagementPercent ||
      adrGrowthRate !== initialValues.adrGrowthRate
    );
  }, [profile, initialValues, fullName, businessEmail, whatsappNumber, whatsappCountryCode, commissionRate,
    constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears,
    mortgageFinancingPercent, mortgageInterestRate, mortgageTermYears, mortgageProcessingFee,
    mortgageValuationFee, mortgageRegistrationPercent, mortgageLifeInsurancePercent, mortgagePropertyInsurance,
    adr, occupancyPercent, strExpensePercent, strManagementPercent, adrGrowthRate]);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      const values = {
        fullName: profile.full_name || '',
        businessEmail: profile.business_email || '',
        whatsappNumber: profile.whatsapp_number || '',
        whatsappCountryCode: profile.whatsapp_country_code || '+971',
        commissionRate: String(profile.commission_rate ?? 2),
        constructionAppreciation: profile.default_construction_appreciation ?? 12,
        growthAppreciation: profile.default_growth_appreciation ?? 8,
        matureAppreciation: profile.default_mature_appreciation ?? 4,
        growthPeriodYears: profile.default_growth_period_years ?? 5,
        mortgageFinancingPercent: profile.default_mortgage_financing_percent ?? 60,
        mortgageInterestRate: profile.default_mortgage_interest_rate ?? 4.5,
        mortgageTermYears: profile.default_mortgage_term_years ?? 25,
        mortgageProcessingFee: profile.default_mortgage_processing_fee ?? 1,
        mortgageValuationFee: profile.default_mortgage_valuation_fee ?? 3000,
        mortgageRegistrationPercent: profile.default_mortgage_registration_percent ?? 0.25,
        mortgageLifeInsurancePercent: profile.default_mortgage_life_insurance_percent ?? 0.4,
        mortgagePropertyInsurance: profile.default_mortgage_property_insurance ?? 1500,
        adr: profile.default_adr ?? 800,
        occupancyPercent: profile.default_occupancy_percent ?? 70,
        strExpensePercent: profile.default_str_expense_percent ?? 25,
        strManagementPercent: profile.default_str_management_percent ?? 15,
        adrGrowthRate: profile.default_adr_growth_rate ?? 3,
      };
      
      setFullName(values.fullName);
      setBusinessEmail(values.businessEmail);
      setWhatsappNumber(values.whatsappNumber);
      setWhatsappCountryCode(values.whatsappCountryCode);
      setCommissionRate(values.commissionRate);
      setConstructionAppreciation(values.constructionAppreciation);
      setGrowthAppreciation(values.growthAppreciation);
      setMatureAppreciation(values.matureAppreciation);
      setGrowthPeriodYears(values.growthPeriodYears);
      setMortgageFinancingPercent(values.mortgageFinancingPercent);
      setMortgageInterestRate(values.mortgageInterestRate);
      setMortgageTermYears(values.mortgageTermYears);
      setMortgageProcessingFee(values.mortgageProcessingFee);
      setMortgageValuationFee(values.mortgageValuationFee);
      setMortgageRegistrationPercent(values.mortgageRegistrationPercent);
      setMortgageLifeInsurancePercent(values.mortgageLifeInsurancePercent);
      setMortgagePropertyInsurance(values.mortgagePropertyInsurance);
      setAdr(values.adr);
      setOccupancyPercent(values.occupancyPercent);
      setStrExpensePercent(values.strExpensePercent);
      setStrManagementPercent(values.strManagementPercent);
      setAdrGrowthRate(values.adrGrowthRate);
      
      setInitialValues(values);
    }
  }, [profile]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
      default_mortgage_valuation_fee: mortgageValuationFee,
      default_mortgage_registration_percent: mortgageRegistrationPercent,
      default_mortgage_life_insurance_percent: mortgageLifeInsurancePercent,
      default_mortgage_property_insurance: mortgagePropertyInsurance,
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
      // Update initial values to current values after save
      setInitialValues({
        fullName, businessEmail, whatsappNumber, whatsappCountryCode, commissionRate,
        constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears,
        mortgageFinancingPercent, mortgageInterestRate, mortgageTermYears, mortgageProcessingFee,
        mortgageValuationFee, mortgageRegistrationPercent, mortgageLifeInsurancePercent, mortgagePropertyInsurance,
        adr, occupancyPercent, strExpensePercent, strManagementPercent, adrGrowthRate
      });
    }
    setSaving(false);
  };

  const handleNavigateAway = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowLeaveWarning(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  const confirmLeave = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowLeaveWarning(false);
    setPendingNavigation(null);
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
    <div className="min-h-screen bg-theme-bg pb-24">
      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {language === 'es' ? 'Cambios sin guardar' : 'Unsaved Changes'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {language === 'es' 
                ? 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin guardar?'
                : 'You have unsaved changes. Are you sure you want to leave without saving?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg-alt border-theme-border text-theme-text hover:bg-theme-bg">
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
              {language === 'es' ? 'Salir sin guardar' : 'Leave without saving'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title={t('accountSettingsTitle')}
        subtitle={hasUnsavedChanges 
          ? (language === 'es' ? '⚠️ Tienes cambios sin guardar' : '⚠️ You have unsaved changes')
          : (language === 'es' ? 'Administra tu perfil y preferencias' : 'Manage your profile and preferences')}
        icon={<Settings className="w-5 h-5" />}
        backLink="/home"
        shortcuts={defaultShortcuts}
        actions={
          <div className="flex items-center gap-3">
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
                <Button 
                  variant="outlineDark" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleNavigateAway('/my-quotes')}
                >
                  {t('accountViewGenerators')}
                </Button>
                <Button 
                  variant="outlineDark" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleNavigateAway('/dashboard')}
                >
                  {t('accountAdminDashboard')}
                </Button>
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
                valuationFee={mortgageValuationFee}
                registrationPercent={mortgageRegistrationPercent}
                lifeInsurancePercent={mortgageLifeInsurancePercent}
                propertyInsurance={mortgagePropertyInsurance}
                setFinancingPercent={setMortgageFinancingPercent}
                setInterestRate={setMortgageInterestRate}
                setTermYears={setMortgageTermYears}
                setProcessingFee={setMortgageProcessingFee}
                setValuationFee={setMortgageValuationFee}
                setRegistrationPercent={setMortgageRegistrationPercent}
                setLifeInsurancePercent={setMortgageLifeInsurancePercent}
                setPropertyInsurance={setMortgagePropertyInsurance}
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

          </div>
        </div>
      </main>

      {/* Floating Save Button */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasUnsavedChanges 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="bg-gradient-to-t from-theme-bg via-theme-bg/95 to-transparent pt-8 pb-6">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="flex items-center justify-between bg-theme-card border border-theme-accent/30 rounded-xl p-4 shadow-2xl shadow-theme-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm text-theme-text">
                  {language === 'es' 
                    ? 'Tienes cambios sin guardar'
                    : 'You have unsaved changes'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Reset to initial values
                    if (initialValues) {
                      setFullName(initialValues.fullName);
                      setBusinessEmail(initialValues.businessEmail);
                      setWhatsappNumber(initialValues.whatsappNumber);
                      setWhatsappCountryCode(initialValues.whatsappCountryCode);
                      setCommissionRate(initialValues.commissionRate);
                      setConstructionAppreciation(initialValues.constructionAppreciation);
                      setGrowthAppreciation(initialValues.growthAppreciation);
                      setMatureAppreciation(initialValues.matureAppreciation);
                      setGrowthPeriodYears(initialValues.growthPeriodYears);
                      setMortgageFinancingPercent(initialValues.mortgageFinancingPercent);
                      setMortgageInterestRate(initialValues.mortgageInterestRate);
                      setMortgageTermYears(initialValues.mortgageTermYears);
                      setMortgageProcessingFee(initialValues.mortgageProcessingFee);
                      setMortgageValuationFee(initialValues.mortgageValuationFee);
                      setMortgageRegistrationPercent(initialValues.mortgageRegistrationPercent);
                      setMortgageLifeInsurancePercent(initialValues.mortgageLifeInsurancePercent);
                      setMortgagePropertyInsurance(initialValues.mortgagePropertyInsurance);
                      setAdr(initialValues.adr);
                      setOccupancyPercent(initialValues.occupancyPercent);
                      setStrExpensePercent(initialValues.strExpensePercent);
                      setStrManagementPercent(initialValues.strManagementPercent);
                      setAdrGrowthRate(initialValues.adrGrowthRate);
                    }
                  }}
                  className="text-theme-text-muted hover:text-theme-text"
                >
                  {language === 'es' ? 'Descartar' : 'Discard'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving 
                    ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (language === 'es' ? 'Guardar cambios' : 'Save Changes')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

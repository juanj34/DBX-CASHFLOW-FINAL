import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Camera, Zap, Briefcase, Moon } from 'lucide-react';
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

const AccountSettings = () => {
  useDocumentTitle("Account Settings");
  const { profile, loading, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+971');
  const [commissionRate, setCommissionRate] = useState('2');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBusinessEmail(profile.business_email || '');
      setWhatsappNumber(profile.whatsapp_number || '');
      setWhatsappCountryCode(profile.whatsapp_country_code || '+971');
      setCommissionRate(String(profile.commission_rate ?? 2));
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
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card">
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-theme-text">{t('accountSettingsTitle')}</h1>
          </div>
          <Button
            variant="outline"
            onClick={signOut}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {t('signOut')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-theme-card border border-theme-border rounded-2xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-theme-card-alt border-4 border-theme-accent/20">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-theme-text-muted" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-theme-accent rounded-full hover:bg-theme-accent/90 transition-colors"
              >
                {uploading ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-theme-bg border-t-transparent" />
                ) : (
                  <Camera className="w-5 h-5 text-theme-bg" />
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

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-theme-text-muted mb-2">{t('accountEmail')}</label>
              <Input
                value={profile.email}
                disabled
                className="bg-theme-bg-alt border-theme-border text-theme-text-muted"
              />
              <p className="text-xs text-theme-text-muted mt-1">{t('accountEmailCannotChange')}</p>
            </div>

            <div>
              <label className="block text-sm text-theme-text-muted mb-2">{t('accountFullName')}</label>
              <Input
                value={fullName || profile.full_name || ''}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('accountEnterFullName')}
                className="bg-theme-bg-alt border-theme-border text-theme-text"
              />
            </div>

            <div>
              <label className="block text-sm text-theme-text-muted mb-2">{t('accountBusinessEmail')}</label>
              <Input
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="your@business.com"
                type="email"
                className="bg-theme-bg-alt border-theme-border text-theme-text"
              />
              <p className="text-xs text-theme-text-muted mt-1">{t('accountBusinessEmailDesc')}</p>
            </div>

            <div>
              <label className="block text-sm text-theme-text-muted mb-2">{t('accountWhatsApp')}</label>
              <div className="flex gap-2">
                <Input
                  value={whatsappCountryCode}
                  onChange={(e) => setWhatsappCountryCode(e.target.value)}
                  placeholder="+971"
                  className="bg-theme-bg-alt border-theme-border text-theme-text w-24"
                />
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="501234567"
                  className="bg-theme-bg-alt border-theme-border text-theme-text flex-1"
                />
              </div>
              <p className="text-xs text-theme-text-muted mt-1">{t('accountWhatsAppDesc')}</p>
            </div>

            {/* Business Settings - Commission Rate */}
            <div className="pt-6 border-t border-theme-border">
              <h3 className="text-lg font-semibold text-theme-text mb-4">{t('businessSettings')}</h3>
              <div>
                <label className="block text-sm text-theme-text-muted mb-2">{t('commissionRate')} (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="2"
                  className="bg-theme-bg-alt border-theme-border text-theme-text w-32"
                />
                <p className="text-xs text-theme-text-muted mt-1">{t('commissionRateDesc')}</p>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm text-theme-text-muted mb-3">{t('themePreference')}</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, config]) => {
                  const Icon = key === 'tech-dark' ? Zap : key === 'consultant' ? Briefcase : Moon;
                  const isSelected = theme === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                        isSelected 
                          ? 'border-theme-accent bg-theme-accent/10' 
                          : 'border-theme-border bg-theme-bg-alt hover:border-theme-border-alt'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
                      <span className={`text-sm ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                        {config.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-theme-text-muted mt-2">{t('themePreferenceDesc')}</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              {saving ? t('accountSaving') : t('accountSaveChanges')}
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-theme-border space-y-3">
            <Link to="/my-quotes" className="block">
              <Button variant="outlineDark" className="w-full">
                {t('accountViewGenerators')}
              </Button>
            </Link>
            <Link to="/dashboard" className="block">
              <Button variant="outlineDark" className="w-full">
                {t('accountAdminDashboard')}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;

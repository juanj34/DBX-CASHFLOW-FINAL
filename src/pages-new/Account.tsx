import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout-new/PageShell';
import { Navbar } from '@/components/layout-new/Navbar';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, TrendingUp, Save, LogOut, Image as ImageIcon, Upload, X } from 'lucide-react';

const Account: React.FC = () => {
  const { profile, loading, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [fullName, setFullName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [constructionAppr, setConstructionAppr] = useState(12);
  const [postConstructionAppr, setPostConstructionAppr] = useState(6);

  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBusinessEmail(profile.business_email || '');
      setWhatsapp(profile.whatsapp_number || '');
      setConstructionAppr(profile.default_construction_appreciation ?? 12);
      const postConstr = profile.default_growth_appreciation != null && profile.default_mature_appreciation != null
        ? Math.round(((profile.default_growth_appreciation + profile.default_mature_appreciation) / 2) * 10) / 10
        : 6;
      setPostConstructionAppr(postConstr);
    }
  }, [profile]);

  const handleLogoUpload = async (file: File) => {
    if (!profile) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${profile.id}/logo_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      toast({ title: 'Logo uploaded' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    await updateProfile({ avatar_url: null });
    toast({ title: 'Logo removed' });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName || null,
      business_email: businessEmail || null,
      whatsapp_number: whatsapp || null,
      default_construction_appreciation: constructionAppr,
      default_growth_appreciation: postConstructionAppr,
      default_mature_appreciation: postConstructionAppr,
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved' });
    }
  };

  if (loading) {
    return (
      <PageShell>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#C9A04A] to-[#B3893A] animate-pulse" />
            <p className="text-sm text-theme-text-muted mt-4">Loading profile...</p>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl text-theme-text mb-1">Account Settings</h1>
        <p className="text-sm text-theme-text-muted mb-8">
          Manage your profile and default strategy parameters.
        </p>

        <div className="space-y-8">
          {/* Company Logo Section */}
          <section className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-theme-border bg-theme-card-alt">
              <ImageIcon className="w-4 h-4 text-theme-accent" />
              <h2 className="text-sm font-semibold text-theme-text">Company Logo</h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-theme-text-muted mb-3">
                Your logo appears on all cashflow documents and shared views.
              </p>
              {profile?.avatar_url ? (
                <div className="flex items-center gap-4">
                  <div className="h-[60px] w-[180px] rounded-lg border border-theme-border bg-theme-bg flex items-center justify-center p-2">
                    <img src={profile.avatar_url} alt="Company logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-theme-border text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Replace
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-theme-negative hover:bg-theme-negative/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="h-[80px] w-full rounded-xl border-2 border-dashed border-theme-border hover:border-theme-accent/40 hover:bg-theme-accent/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-theme-text-muted" />
                      <span className="text-xs text-theme-text-muted">Click to upload logo (PNG, JPG, max 2MB)</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>
          </section>

          {/* Profile Section */}
          <section className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-theme-border bg-theme-card-alt">
              <User className="w-4 h-4 text-theme-accent" />
              <h2 className="text-sm font-semibold text-theme-text">Profile</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs text-theme-text-muted mb-1.5">Email</Label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="bg-theme-bg border-theme-border text-theme-text-muted text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted mb-1.5">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="bg-theme-bg border-theme-border text-theme-text text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted mb-1.5">Business Email</Label>
                <Input
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@yourbrokerage.com"
                  className="bg-theme-bg border-theme-border text-theme-text text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-theme-text-muted mb-1.5">WhatsApp Number</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="bg-theme-bg border-theme-border text-theme-text text-sm"
                />
              </div>
            </div>
          </section>

          {/* Default Appreciation Rates */}
          <section className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-theme-border bg-theme-card-alt">
              <TrendingUp className="w-4 h-4 text-theme-accent" />
              <h2 className="text-sm font-semibold text-theme-text">Default Appreciation Rates</h2>
            </div>
            <div className="p-5 space-y-6">
              <p className="text-xs text-theme-text-muted">
                These rates will be pre-filled when creating new strategies. You can always override them per strategy.
              </p>

              {/* Construction */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm text-theme-text">During Construction</Label>
                    <p className="text-xs text-theme-text-muted mt-0.5">Booking to handover</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-lg text-theme-accent font-semibold">{constructionAppr}</span>
                    <span className="text-sm text-theme-text-muted">%</span>
                  </div>
                </div>
                <Slider
                  value={[constructionAppr]}
                  onValueChange={([v]) => setConstructionAppr(v)}
                  min={0}
                  max={25}
                  step={0.5}
                  className="roi-slider-lime"
                />
                <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
                  <span>0%</span>
                  <span>25%</span>
                </div>
              </div>

              {/* Post-Construction */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm text-theme-text">After Handover</Label>
                    <p className="text-xs text-theme-text-muted mt-0.5">Ongoing appreciation</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-lg text-theme-accent font-semibold">{postConstructionAppr}</span>
                    <span className="text-sm text-theme-text-muted">%</span>
                  </div>
                </div>
                <Slider
                  value={[postConstructionAppr]}
                  onValueChange={([v]) => setPostConstructionAppr(v)}
                  min={0}
                  max={20}
                  step={0.5}
                  className="roi-slider-lime"
                />
                <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] shadow-lg shadow-[#B3893A]/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-theme-negative hover:bg-theme-negative/10 border border-theme-negative/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </PageShell>
  );
};

export default Account;

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, User, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, PROFILE_AVATAR_CONFIG } from '@/lib/imageUtils';
import { useToast } from '@/hooks/use-toast';

const AccountSettings = () => {
  const { profile, loading, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when profile loads
  useState(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  });

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
    const { error } = await updateProfile({ full_name: fullName });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
      </div>
    );
  }

  if (!profile) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/map">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Account Settings</h1>
          </div>
          <Button
            variant="outline"
            onClick={signOut}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2a3142] border-4 border-[#CCFF00]/20">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-[#CCFF00] rounded-full hover:bg-[#CCFF00]/90 transition-colors"
              >
                {uploading ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Camera className="w-5 h-5 text-black" />
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
            <p className="text-xs text-gray-500 mt-2">Click camera to upload photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <Input
                value={profile.email}
                disabled
                className="bg-[#0d1117] border-[#2a3142] text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <Input
                value={fullName || profile.full_name || ''}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-[#2a3142] space-y-3">
            <Link to="/my-quotes" className="block">
              <Button variant="outline" className="w-full border-[#2a3142] text-gray-300 hover:bg-[#2a3142]">
                View My Cashflow Statements
              </Button>
            </Link>
            <Link to="/dashboard" className="block">
              <Button variant="outline" className="w-full border-[#2a3142] text-gray-300 hover:bg-[#2a3142]">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;

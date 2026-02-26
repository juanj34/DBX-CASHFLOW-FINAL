import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageShell } from '@/components/layout-new/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      toast.success('Password updated successfully');

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="font-display text-xl text-theme-text mb-2">Link Expired</h1>
              <p className="text-sm text-theme-text-muted">{error}</p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A]"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (success) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display text-xl text-theme-text mb-2">Password Updated</h1>
              <p className="text-sm text-theme-text-muted">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B3893A]/5 blur-[120px]" />

        <div className="w-full max-w-sm relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A04A] to-[#B3893A] flex items-center justify-center shadow-lg shadow-[#B3893A]/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl text-theme-text">Reset Password</h1>
              <p className="text-xs text-theme-text-muted">Enter your new password below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-theme-text-muted">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/50 focus:border-theme-accent focus:ring-theme-accent/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm text-theme-text-muted">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/50 focus:border-theme-accent focus:ring-theme-accent/20"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] font-semibold shadow-lg shadow-[#B3893A]/20 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default ResetPassword;

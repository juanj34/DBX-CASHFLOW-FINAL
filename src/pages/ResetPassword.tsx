import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validationSchemas';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const ResetPassword = () => {
  useDocumentTitle('Reset Password');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password', '');

  useEffect(() => {
    setPasswordValue(watchedPassword);
  }, [watchedPassword]);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('resetPasswordInvalidLink'));
      }
    };
    checkSession();
  }, [t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success(t('resetPasswordSuccess'));
      
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || t('resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">{t('resetPasswordInvalidTitle')}</h1>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full">
              {t('resetPasswordGoToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">{t('resetPasswordSuccessTitle')}</h1>
              <p className="text-sm text-gray-400">{t('resetPasswordSuccessDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#CCFF00]" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">{t('resetPasswordTitle')}</h1>
            <p className="text-sm text-gray-400">{t('resetPasswordDescription')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPasswordNewPassword')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={loading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
              <PasswordStrengthIndicator password={passwordValue} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('resetPasswordConfirm')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={loading}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('resetPasswordUpdating')}
                </>
              ) : (
                t('resetPasswordUpdate')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

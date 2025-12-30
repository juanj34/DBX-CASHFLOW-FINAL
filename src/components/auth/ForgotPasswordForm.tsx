import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validationSchemas';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success(t('forgotPasswordEmailSent'));
    } catch (error: any) {
      toast.error(error.message || t('forgotPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{t('forgotPasswordCheckEmail')}</h3>
          <p className="text-sm text-gray-400">
            {t('forgotPasswordEmailSentTo')} <span className="text-white">{getValues('email')}</span>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            {t('forgotPasswordCheckSpam')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('forgotPasswordBackToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white">{t('forgotPasswordTitle')}</h3>
        <p className="text-sm text-gray-400">{t('forgotPasswordDescription')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">{t('loginEmail')}</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            disabled={loading}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('forgotPasswordSending')}
            </>
          ) : (
            t('forgotPasswordSendLink')
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('forgotPasswordBackToLogin')}
        </Button>
      </form>
    </div>
  );
};

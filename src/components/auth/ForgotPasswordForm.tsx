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
import { motion } from 'framer-motion';

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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{t('forgotPasswordCheckEmail')}</h3>
          <p className="text-sm text-white/60">
            {t('forgotPasswordEmailSentTo')} <span className="text-white">{getValues('email')}</span>
          </p>
          <p className="text-xs text-white/40 mt-4">
            {t('forgotPasswordCheckSpam')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('forgotPasswordBackToLogin')}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white">{t('forgotPasswordTitle')}</h3>
        <p className="text-sm text-white/60">{t('forgotPasswordDescription')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-white/80 text-sm font-medium">
            {t('loginEmail')}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={loading}
              className={`h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:ring-cyan-400/20 rounded-xl transition-all ${errors.email ? 'border-red-400/50' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25" 
          disabled={loading}
        >
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
          className="w-full h-12 text-white/60 hover:text-white hover:bg-white/5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('forgotPasswordBackToLogin')}
        </Button>
      </form>
    </motion.div>
  );
};

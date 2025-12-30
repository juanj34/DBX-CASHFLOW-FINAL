import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail, MessageSquare, Loader2, CheckCircle, Send } from 'lucide-react';
import { contactSchema, type ContactFormData } from '@/lib/validationSchemas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  useDocumentTitle('Contact Us');
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);

    try {
      // Store in database
      const { error } = await supabase.from('contact_submissions').insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });

      if (error) throw error;

      setSuccess(true);
      reset();
      toast.success(t('contactSuccessMessage'));
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast.error(t('contactErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('contactThankYouTitle')}</h2>
            <p className="text-gray-400">{t('contactThankYouText')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline">{t('contactBackToHome')}</Button>
            </Link>
            <Button onClick={() => setSuccess(false)}>{t('contactSendAnother')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('contactBackToHome')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#CCFF00]" />
            <span className="font-semibold">{t('contactTitle')}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left - Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold">{t('contactGetInTouch')}</h1>
              <p className="text-gray-400 text-lg">{t('contactDescription')}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t('contactEmailTitle')}</h3>
                  <p className="text-gray-400">{t('contactEmailText')}</p>
                  <a href="mailto:support@dubaiinvestpro.com" className="text-cyan-400 hover:text-cyan-300">
                    support@dubaiinvestpro.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t('contactWhatsAppTitle')}</h3>
                  <p className="text-gray-400">{t('contactWhatsAppText')}</p>
                  <a 
                    href="https://wa.me/971000000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300"
                  >
                    +971 XX XXX XXXX
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl border border-gray-700/50">
              <h3 className="font-semibold text-white mb-2">{t('contactResponseTime')}</h3>
              <p className="text-gray-400 text-sm">{t('contactResponseTimeText')}</p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t('contactFormName')}</Label>
                <Input
                  id="name"
                  placeholder={t('contactFormNamePlaceholder')}
                  {...register('name')}
                  disabled={loading}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('contactFormEmail')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('contactFormEmailPlaceholder')}
                  {...register('email')}
                  disabled={loading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t('contactFormSubject')}</Label>
                <Input
                  id="subject"
                  placeholder={t('contactFormSubjectPlaceholder')}
                  {...register('subject')}
                  disabled={loading}
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                  <p className="text-xs text-red-400">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('contactFormMessage')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('contactFormMessagePlaceholder')}
                  rows={5}
                  {...register('message')}
                  disabled={loading}
                  className={errors.message ? 'border-red-500' : ''}
                />
                {errors.message && (
                  <p className="text-xs text-red-400">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('contactFormSending')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('contactFormSubmit')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span>© 2024 Dubai Invest Pro</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('landingPrivacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('landingTerms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;

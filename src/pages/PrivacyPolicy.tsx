import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const PrivacyPolicy = () => {
  useDocumentTitle('Privacy Policy');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('privacyBackToHome')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold">{t('privacyTitle')}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold">{t('privacyTitle')}</h1>
            <p className="text-gray-400">{t('privacyLastUpdated')}: December 2024</p>
          </div>

          <div className="prose prose-invert prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacyIntroTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyIntroText')}
              </p>
            </section>

            {/* Information We Collect */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacyCollectTitle')}</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-medium text-white mb-2">{t('privacyCollectAccountTitle')}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('privacyCollectAccountItem1')}</li>
                    <li>{t('privacyCollectAccountItem2')}</li>
                    <li>{t('privacyCollectAccountItem3')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">{t('privacyCollectUsageTitle')}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('privacyCollectUsageItem1')}</li>
                    <li>{t('privacyCollectUsageItem2')}</li>
                    <li>{t('privacyCollectUsageItem3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacyUseTitle')}</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>{t('privacyUseItem1')}</li>
                <li>{t('privacyUseItem2')}</li>
                <li>{t('privacyUseItem3')}</li>
                <li>{t('privacyUseItem4')}</li>
                <li>{t('privacyUseItem5')}</li>
              </ul>
            </section>

            {/* Data Storage & Security */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacySecurityTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacySecurityText')}
              </p>
            </section>

            {/* Your Rights */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacyRightsTitle')}</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>{t('privacyRightsItem1')}</li>
                <li>{t('privacyRightsItem2')}</li>
                <li>{t('privacyRightsItem3')}</li>
                <li>{t('privacyRightsItem4')}</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">{t('privacyContactTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyContactText')}{' '}
                <Link to="/contact" className="text-cyan-400 hover:text-cyan-300 underline">
                  {t('privacyContactLink')}
                </Link>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span>© 2024 Dubai Invest Pro</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">{t('landingTerms')}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t('landingContact')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;

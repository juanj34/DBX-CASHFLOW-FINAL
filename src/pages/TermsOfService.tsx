import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsOfService = () => {
  useDocumentTitle('Terms of Service');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('termsBackToHome')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">{t('termsTitle')}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold">{t('termsTitle')}</h1>
            <p className="text-gray-400">{t('termsLastUpdated')}: December 2024</p>
          </div>

          <div className="prose prose-invert prose-gray max-w-none space-y-8">
            {/* Acceptance */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsAcceptanceTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsAcceptanceText')}
              </p>
            </section>

            {/* Description of Service */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsServiceTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsServiceText')}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-300 mt-4">
                <li>{t('termsServiceItem1')}</li>
                <li>{t('termsServiceItem2')}</li>
                <li>{t('termsServiceItem3')}</li>
                <li>{t('termsServiceItem4')}</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsUserTitle')}</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>{t('termsUserItem1')}</li>
                <li>{t('termsUserItem2')}</li>
                <li>{t('termsUserItem3')}</li>
                <li>{t('termsUserItem4')}</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsIPTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsIPText')}
              </p>
            </section>

            {/* Disclaimer */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsDisclaimerTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsDisclaimerText')}
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsLiabilityTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsLiabilityText')}
              </p>
            </section>

            {/* Termination */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsTerminationTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsTerminationText')}
              </p>
            </section>

            {/* Governing Law */}
            <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">{t('termsGoverningTitle')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsGoverningText')}
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
            <Link to="/privacy" className="hover:text-white transition-colors">{t('landingPrivacy')}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t('landingContact')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;

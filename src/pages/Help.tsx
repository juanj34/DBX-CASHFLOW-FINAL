import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, Search, MessageSquare, BookOpen, Video } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const Help = () => {
  useDocumentTitle('Help Center');
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQItem[] = [
    // Getting Started
    { category: 'gettingStarted', question: t('helpFaq1Question'), answer: t('helpFaq1Answer') },
    { category: 'gettingStarted', question: t('helpFaq2Question'), answer: t('helpFaq2Answer') },
    { category: 'gettingStarted', question: t('helpFaq3Question'), answer: t('helpFaq3Answer') },
    // Quotes
    { category: 'quotes', question: t('helpFaq4Question'), answer: t('helpFaq4Answer') },
    { category: 'quotes', question: t('helpFaq5Question'), answer: t('helpFaq5Answer') },
    { category: 'quotes', question: t('helpFaq6Question'), answer: t('helpFaq6Answer') },
    // Account
    { category: 'account', question: t('helpFaq7Question'), answer: t('helpFaq7Answer') },
    { category: 'account', question: t('helpFaq8Question'), answer: t('helpFaq8Answer') },
    // Technical
    { category: 'technical', question: t('helpFaq9Question'), answer: t('helpFaq9Answer') },
    { category: 'technical', question: t('helpFaq10Question'), answer: t('helpFaq10Answer') },
  ];

  const categories = [
    { id: 'gettingStarted', label: t('helpCategoryGettingStarted'), icon: BookOpen },
    { id: 'quotes', label: t('helpCategoryQuotes'), icon: HelpCircle },
    { id: 'account', label: t('helpCategoryAccount'), icon: HelpCircle },
    { id: 'technical', label: t('helpCategoryTechnical'), icon: HelpCircle },
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFaqsByCategory = (categoryId: string) =>
    filteredFaqs.filter(faq => faq.category === categoryId);

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('helpBackToHome')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold">{t('helpTitle')}</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0a0f1a] to-transparent py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold">{t('helpHeroTitle')}</h1>
          <p className="text-gray-400 text-lg">{t('helpHeroSubtitle')}</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder={t('helpSearchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-12">
          {/* Quick Links */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/contact" className="group">
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-cyan-500/50 transition-colors">
                <MessageSquare className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-1">{t('helpContactSupport')}</h3>
                <p className="text-sm text-gray-400">{t('helpContactSupportDesc')}</p>
              </div>
            </Link>
            <a href="#faq" className="group">
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors">
                <BookOpen className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-1">{t('helpBrowseFAQ')}</h3>
                <p className="text-sm text-gray-400">{t('helpBrowseFAQDesc')}</p>
              </div>
            </a>
            <div className="group cursor-not-allowed opacity-60">
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                <Video className="w-8 h-8 text-[#CCFF00] mb-3" />
                <h3 className="font-semibold text-white mb-1">{t('helpVideoTutorials')}</h3>
                <p className="text-sm text-gray-400">{t('helpVideoTutorialsDesc')}</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="space-y-8">
            <h2 className="text-2xl font-bold">{t('helpFAQTitle')}</h2>
            
            {categories.map(category => {
              const categoryFaqs = getFaqsByCategory(category.id);
              if (categoryFaqs.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                    <category.icon className="w-5 h-5" />
                    {category.label}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {categoryFaqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category.id}-${index}`}
                        className="bg-gray-900/50 rounded-xl border border-gray-800 px-6"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="text-white">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-400 pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">{t('helpNoResults')}</p>
                <Link to="/contact">
                  <Button variant="outline" className="mt-4">
                    {t('helpContactUs')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Still need help? */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/50 p-8 text-center">
            <h3 className="text-xl font-bold mb-2">{t('helpStillNeedHelp')}</h3>
            <p className="text-gray-400 mb-6">{t('helpStillNeedHelpDesc')}</p>
            <Link to="/contact">
              <Button size="lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('helpContactTeam')}
              </Button>
            </Link>
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

export default Help;

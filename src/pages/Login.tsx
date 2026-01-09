import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLogo } from "@/components/AppLogo";
import loginBg from "@/assets/login-bg.jpg";
import { motion } from "framer-motion";

const Login = () => {
  useDocumentTitle("Sign In");
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-purple-900/40" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CCFF00]/5 rounded-full blur-3xl" />

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">
          {/* Logo & Branding */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-6">
              <AppLogo size="lg" showGlow={true} linkTo="" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('loginTitle')}
            </h1>
            <p className="text-sm text-white/60">
              {t('loginSubtitle')}
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20 text-white/50 rounded-lg transition-all duration-300"
                >
                  {t('loginSignIn')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20 text-white/50 rounded-lg transition-all duration-300"
                >
                  {t('loginSignUp')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <SignupForm />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Footer Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-white/10"
          >
            <div className="flex items-center justify-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Secure</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span>256-bit SSL</span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span>GDPR Compliant</span>
            </div>
          </motion.div>
        </div>

        {/* Glow Effect Behind Card */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-[#CCFF00]/20 blur-3xl opacity-50 rounded-3xl" />
      </motion.div>
    </div>
  );
};

export default Login;

import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  useDocumentTitle("Sign In");
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg p-4">
      <div className="w-full max-w-md">
        <div className="bg-theme-card border border-theme-border rounded-2xl p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-theme-accent/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-theme-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-theme-text">{t('loginTitle')}</h1>
            <p className="text-sm text-theme-text-muted">{t('loginSubtitle')}</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-theme-bg-alt">
              <TabsTrigger value="login" className="data-[state=active]:bg-theme-card-alt data-[state=active]:text-theme-text text-theme-text-muted">{t('loginSignIn')}</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-theme-card-alt data-[state=active]:text-theme-text text-theme-text-muted">{t('loginSignUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;

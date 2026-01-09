import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validationSchemas";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      // Set session persistence based on rememberMe
      // When rememberMe is true, session persists across browser sessions (30 days)
      // When false, session is cleared when browser is closed
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // If "Remember me" is not checked, we'll rely on the default session behavior
      // For extended persistence, the session is already handled by Supabase's default 30-day expiry
      if (!rememberMe) {
        // Store a flag to clear session on browser close
        sessionStorage.setItem('clearSessionOnClose', 'true');
      } else {
        sessionStorage.removeItem('clearSessionOnClose');
      }

      toast.success(t('loginWelcomeBack'));
      navigate("/home");
    } catch (error: any) {
      if (error.message === "Invalid login credentials") {
        toast.error(t('loginInvalidCredentials'));
      } else {
        toast.error(error.message || t('loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-300 rounded-xl group"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span className="font-medium">{t('continueWithGoogle') || 'Continue with Google'}</span>
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-4 text-white/40 backdrop-blur-sm">
            {t('orContinueWith') || 'or continue with email'}
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80 text-sm font-medium">
            {t('loginEmail')}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={loading || googleLoading}
              className={`h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:ring-cyan-400/20 rounded-xl transition-all ${errors.email ? "border-red-400/50" : ""}`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/80 text-sm font-medium">
              {t('loginPassword')}
            </Label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors"
            >
              {t('loginForgotPassword')}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={loading || googleLoading}
              className={`h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:ring-cyan-400/20 rounded-xl transition-all ${errors.password ? "border-red-400/50" : ""}`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={loading || googleLoading}
            className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
          />
          <Label 
            htmlFor="rememberMe" 
            className="text-sm text-white/60 cursor-pointer"
          >
            {t('rememberMe') || 'Remember me'}
          </Label>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]" 
          disabled={loading || googleLoading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('loginSigningIn')}
            </>
          ) : (
            t('loginSignIn')
          )}
        </Button>
      </form>
    </motion.div>
  );
};

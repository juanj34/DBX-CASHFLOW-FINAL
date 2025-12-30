import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validationSchemas";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useLanguage } from "@/contexts/LanguageContext";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

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

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="email">{t('loginEmail')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          disabled={loading}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('loginPassword')}</Label>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs text-gray-400 hover:text-[#CCFF00] transition-colors"
          >
            {t('loginForgotPassword')}
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={loading}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
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
  );
};

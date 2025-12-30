import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signupSchema, type SignupFormData } from "@/lib/validationSchemas";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { useLanguage } from "@/contexts/LanguageContext";

export const SignupForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  // Watch password for strength indicator
  const watchedPassword = watch("password", "");
  const acceptTerms = watch("acceptTerms");

  useEffect(() => {
    setPasswordValue(watchedPassword);
  }, [watchedPassword]);

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/home`;
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error(t('signupAlreadyRegistered'));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('signupSuccess'));
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || t('signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t('signupFullName')}</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          {...register("fullName")}
          disabled={loading}
          className={errors.fullName ? "border-red-500" : ""}
        />
        {errors.fullName && (
          <p className="text-xs text-red-400">{errors.fullName.message}</p>
        )}
      </div>

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
        <Label htmlFor="password">{t('loginPassword')}</Label>
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
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
          disabled={loading}
          className={errors.acceptTerms ? "border-red-500" : ""}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="acceptTerms"
            className="text-sm text-gray-400 cursor-pointer"
          >
            {t('signupAcceptTerms')}{" "}
            <Link to="/terms" className="text-[#CCFF00] hover:underline" target="_blank">
              {t('landingTerms')}
            </Link>{" "}
            {t('signupAnd')}{" "}
            <Link to="/privacy" className="text-[#CCFF00] hover:underline" target="_blank">
              {t('landingPrivacy')}
            </Link>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-red-400">{errors.acceptTerms.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('signupCreatingAccount')}
          </>
        ) : (
          t('signupCreateAccount')
        )}
      </Button>
    </form>
  );
};

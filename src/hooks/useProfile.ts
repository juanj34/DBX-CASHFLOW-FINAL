import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
  commission_rate: number | null;
  market_dubai_yield: number | null;
  market_mortgage_rate: number | null;
  market_top_area: string | null;
  // Growth projection defaults
  default_construction_appreciation: number | null;
  default_growth_appreciation: number | null;
  default_mature_appreciation: number | null;
  default_growth_period_years: number | null;
  // Airbnb/STR defaults
  default_adr: number | null;
  default_occupancy_percent: number | null;
  default_str_expense_percent: number | null;
  default_str_management_percent: number | null;
  default_adr_growth_rate: number | null;
  // Mortgage defaults
  default_mortgage_financing_percent: number | null;
  default_mortgage_interest_rate: number | null;
  default_mortgage_term_years: number | null;
  default_mortgage_processing_fee: number | null;
  default_mortgage_valuation_fee: number | null;
  default_mortgage_registration_percent: number | null;
  default_mortgage_life_insurance_percent: number | null;
  default_mortgage_property_insurance: number | null;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code, commission_rate, market_dubai_yield, market_mortgage_rate, market_top_area, default_construction_appreciation, default_growth_appreciation, default_mature_appreciation, default_growth_period_years, default_adr, default_occupancy_percent, default_str_expense_percent, default_str_management_percent, default_adr_growth_rate, default_mortgage_financing_percent, default_mortgage_interest_rate, default_mortgage_term_years, default_mortgage_processing_fee, default_mortgage_valuation_fee, default_mortgage_registration_percent, default_mortgage_life_insurance_percent, default_mortgage_property_insurance')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'business_email' | 'whatsapp_number' | 'whatsapp_country_code' | 'commission_rate' | 'market_dubai_yield' | 'market_mortgage_rate' | 'market_top_area' | 'default_construction_appreciation' | 'default_growth_appreciation' | 'default_mature_appreciation' | 'default_growth_period_years' | 'default_adr' | 'default_occupancy_percent' | 'default_str_expense_percent' | 'default_str_management_percent' | 'default_adr_growth_rate' | 'default_mortgage_financing_percent' | 'default_mortgage_interest_rate' | 'default_mortgage_term_years' | 'default_mortgage_processing_fee' | 'default_mortgage_valuation_fee' | 'default_mortgage_registration_percent' | 'default_mortgage_life_insurance_percent' | 'default_mortgage_property_insurance'>>) => {
    if (!profile) return { error: new Error('No profile') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  return { profile, loading, updateProfile };
};

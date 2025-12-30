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
        .select('id, email, full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code, commission_rate, market_dubai_yield, market_mortgage_rate, market_top_area')
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

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'business_email' | 'whatsapp_number' | 'whatsapp_country_code' | 'commission_rate' | 'market_dubai_yield' | 'market_mortgage_rate' | 'market_top_area'>>) => {
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

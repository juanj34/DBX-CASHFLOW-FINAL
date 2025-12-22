import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppreciationPreset {
  id: string;
  user_id: string;
  name: string;
  construction_appreciation: number;
  growth_appreciation: number;
  mature_appreciation: number;
  growth_period_years: number;
  rent_growth_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface PresetValues {
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  rentGrowthRate?: number;
}

export const useAppreciationPresets = () => {
  const [presets, setPresets] = useState<AppreciationPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPresets([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appreciation_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error('Error fetching presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appreciation presets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const savePreset = async (name: string, values: PresetValues): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save presets',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('appreciation_presets')
        .insert({
          user_id: user.id,
          name,
          construction_appreciation: values.constructionAppreciation,
          growth_appreciation: values.growthAppreciation,
          mature_appreciation: values.matureAppreciation,
          growth_period_years: values.growthPeriodYears,
          rent_growth_rate: values.rentGrowthRate || null,
        });

      if (error) throw error;

      toast({
        title: 'Preset Saved',
        description: `"${name}" has been saved`,
      });

      await fetchPresets();
      return true;
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preset',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePreset = async (id: string, name: string, values: PresetValues): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('appreciation_presets')
        .update({
          name,
          construction_appreciation: values.constructionAppreciation,
          growth_appreciation: values.growthAppreciation,
          mature_appreciation: values.matureAppreciation,
          growth_period_years: values.growthPeriodYears,
          rent_growth_rate: values.rentGrowthRate || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Preset Updated',
        description: `"${name}" has been updated`,
      });

      await fetchPresets();
      return true;
    } catch (error) {
      console.error('Error updating preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preset',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePreset = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('appreciation_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Preset Deleted',
        description: 'Appreciation preset has been deleted',
      });

      setPresets(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete preset',
        variant: 'destructive',
      });
      return false;
    }
  };

  const applyPreset = (preset: AppreciationPreset): PresetValues => {
    return {
      constructionAppreciation: preset.construction_appreciation,
      growthAppreciation: preset.growth_appreciation,
      matureAppreciation: preset.mature_appreciation,
      growthPeriodYears: preset.growth_period_years,
      rentGrowthRate: preset.rent_growth_rate || undefined,
    };
  };

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return {
    presets,
    loading,
    saving,
    fetchPresets,
    savePreset,
    updatePreset,
    deletePreset,
    applyPreset,
  };
};

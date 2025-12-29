import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExitPreset {
  id: string;
  user_id: string;
  name: string;
  exit_months: number[];
  minimum_exit_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ExitPresetValues {
  exitMonths: number[];
  minimumExitThreshold: number;
}

export const useExitPresets = () => {
  const [presets, setPresets] = useState<ExitPreset[]>([]);
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
        .from('exit_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      // Parse JSONB exit_months to array
      const parsedData = (data || []).map(preset => ({
        ...preset,
        exit_months: Array.isArray(preset.exit_months) ? preset.exit_months : [],
      }));
      
      setPresets(parsedData as ExitPreset[]);
    } catch (error) {
      console.error('Error fetching exit presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exit presets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const savePreset = async (name: string, values: ExitPresetValues): Promise<boolean> => {
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
        .from('exit_presets')
        .insert({
          user_id: user.id,
          name,
          exit_months: values.exitMonths,
          minimum_exit_threshold: values.minimumExitThreshold,
        });

      if (error) throw error;

      toast({
        title: 'Preset Saved',
        description: `"${name}" has been saved`,
      });

      await fetchPresets();
      return true;
    } catch (error) {
      console.error('Error saving exit preset:', error);
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

  const updatePreset = async (id: string, name: string, values: ExitPresetValues): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('exit_presets')
        .update({
          name,
          exit_months: values.exitMonths,
          minimum_exit_threshold: values.minimumExitThreshold,
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
      console.error('Error updating exit preset:', error);
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
        .from('exit_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Preset Deleted',
        description: 'Exit preset has been deleted',
      });

      setPresets(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting exit preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete preset',
        variant: 'destructive',
      });
      return false;
    }
  };

  const applyPreset = (preset: ExitPreset): ExitPresetValues => {
    return {
      exitMonths: preset.exit_months,
      minimumExitThreshold: preset.minimum_exit_threshold,
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

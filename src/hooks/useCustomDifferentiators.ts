import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ValueDifferentiator, CUSTOM_DIFFERENTIATOR_ICON, DifferentiatorCategory } from '@/components/roi/valueDifferentiators';
import { useToast } from '@/hooks/use-toast';

export interface CustomDifferentiatorRow {
  id: string;
  user_id: string;
  name: string;
  name_es: string | null;
  category: string;
  impacts_appreciation: boolean;
  appreciation_bonus: number;
  tooltip: string | null;
  tooltip_es: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomDifferentiatorInput {
  name: string;
  nameEs?: string;
  category?: DifferentiatorCategory;
  impactsAppreciation: boolean;
  appreciationBonus: number;
  tooltip?: string;
  tooltipEs?: string;
}

export const useCustomDifferentiators = () => {
  const [customDifferentiators, setCustomDifferentiators] = useState<ValueDifferentiator[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Convert DB row to ValueDifferentiator
  const rowToDifferentiator = (row: CustomDifferentiatorRow): ValueDifferentiator => ({
    id: `custom-${row.id}`,
    name: row.name,
    nameEs: row.name_es || row.name,
    category: (row.category as DifferentiatorCategory) || 'custom',
    icon: CUSTOM_DIFFERENTIATOR_ICON,
    impactsAppreciation: row.impacts_appreciation,
    appreciationBonus: Number(row.appreciation_bonus) || 0,
    tooltip: row.tooltip || undefined,
    tooltipEs: row.tooltip_es || undefined,
    isCustom: true,
  });

  // Fetch custom differentiators
  const fetchCustomDifferentiators = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_differentiators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setCustomDifferentiators(data.map(rowToDifferentiator));
      }
    } catch (error) {
      console.error('Error fetching custom differentiators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new custom differentiator
  const createDifferentiator = async (input: CustomDifferentiatorInput): Promise<ValueDifferentiator | null> => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('custom_differentiators')
        .insert({
          user_id: user.id,
          name: input.name,
          name_es: input.nameEs || null,
          category: input.category || 'custom',
          impacts_appreciation: input.impactsAppreciation,
          appreciation_bonus: input.appreciationBonus,
          tooltip: input.tooltip || null,
          tooltip_es: input.tooltipEs || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newDifferentiator = rowToDifferentiator(data);
      setCustomDifferentiators(prev => [newDifferentiator, ...prev]);

      toast({
        title: 'Differentiator created',
        description: `"${input.name}" has been saved.`,
      });

      return newDifferentiator;
    } catch (error) {
      console.error('Error creating custom differentiator:', error);
      toast({
        title: 'Error',
        description: 'Failed to create differentiator.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Delete a custom differentiator
  const deleteDifferentiator = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      // Extract the actual UUID from the prefixed ID
      const uuid = id.replace('custom-', '');

      const { error } = await supabase
        .from('custom_differentiators')
        .delete()
        .eq('id', uuid);

      if (error) throw error;

      setCustomDifferentiators(prev => prev.filter(d => d.id !== id));

      toast({
        title: 'Differentiator deleted',
        description: 'Custom differentiator has been removed.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting custom differentiator:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete differentiator.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchCustomDifferentiators();
  }, [fetchCustomDifferentiators]);

  return {
    customDifferentiators,
    loading,
    saving,
    createDifferentiator,
    deleteDifferentiator,
    refetch: fetchCustomDifferentiators,
  };
};

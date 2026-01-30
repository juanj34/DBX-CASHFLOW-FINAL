import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecondaryInputs, DEFAULT_SECONDARY_INPUTS } from '@/components/roi/secondary/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SecondaryComparison {
  id: string;
  broker_id: string;
  title: string;
  quote_id: string | null;
  secondary_inputs: SecondaryInputs;
  exit_months: number[];
  rental_mode: 'long-term' | 'airbnb';
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface DbSecondaryComparison {
  id: string;
  broker_id: string;
  title: string;
  quote_id: string | null;
  secondary_inputs: unknown;
  exit_months: unknown;
  rental_mode: string | null;
  share_token: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const parseDbRecord = (record: DbSecondaryComparison): SecondaryComparison => ({
  id: record.id,
  broker_id: record.broker_id,
  title: record.title,
  quote_id: record.quote_id,
  secondary_inputs: (record.secondary_inputs as SecondaryInputs) || DEFAULT_SECONDARY_INPUTS,
  exit_months: Array.isArray(record.exit_months) ? record.exit_months as number[] : [36, 60, 120],
  rental_mode: (record.rental_mode as 'long-term' | 'airbnb') || 'long-term',
  share_token: record.share_token,
  is_public: record.is_public ?? false,
  created_at: record.created_at || new Date().toISOString(),
  updated_at: record.updated_at || new Date().toISOString(),
});

export const useSecondaryComparisons = () => {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState<SecondaryComparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all user's comparisons
  const fetchComparisons = useCallback(async () => {
    if (!user?.id) {
      setComparisons([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('secondary_comparisons') as any)
        .select('*')
        .eq('broker_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setComparisons((data || []).map(parseDbRecord));
    } catch (error) {
      console.error('Error fetching secondary comparisons:', error);
      toast.error('Error loading comparisons');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  // Save new comparison
  const saveComparison = async (
    title: string,
    quoteId: string | null,
    secondaryInputs: SecondaryInputs,
    exitMonths: number[],
    rentalMode: 'long-term' | 'airbnb'
  ): Promise<SecondaryComparison | null> => {
    if (!user?.id) {
      toast.error('Must be logged in to save');
      return null;
    }

    try {
      const { data, error } = await (supabase
        .from('secondary_comparisons') as any)
        .insert({
          broker_id: user.id,
          title,
          quote_id: quoteId,
          secondary_inputs: secondaryInputs,
          exit_months: exitMonths,
          rental_mode: rentalMode,
        })
        .select()
        .single();

      if (error) throw error;

      const newComparison = parseDbRecord(data);
      setComparisons(prev => [newComparison, ...prev]);
      toast.success('Comparison saved');
      return newComparison;
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast.error('Error saving comparison');
      return null;
    }
  };

  // Update existing comparison
  const updateComparison = async (
    id: string,
    updates: Partial<Pick<SecondaryComparison, 'title' | 'secondary_inputs' | 'exit_months' | 'rental_mode'>>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.secondary_inputs !== undefined) dbUpdates.secondary_inputs = updates.secondary_inputs;
      if (updates.exit_months !== undefined) dbUpdates.exit_months = updates.exit_months;
      if (updates.rental_mode !== undefined) dbUpdates.rental_mode = updates.rental_mode;

      const { error } = await (supabase
        .from('secondary_comparisons') as any)
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setComparisons(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ));
      toast.success('Comparison updated');
      return true;
    } catch (error) {
      console.error('Error updating comparison:', error);
      toast.error('Error updating comparison');
      return false;
    }
  };

  // Delete comparison
  const deleteComparison = async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from('secondary_comparisons') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComparisons(prev => prev.filter(c => c.id !== id));
      toast.success('Comparison deleted');
      return true;
    } catch (error) {
      console.error('Error deleting comparison:', error);
      toast.error('Error deleting comparison');
      return false;
    }
  };

  // Load single comparison by ID
  const loadComparison = async (id: string): Promise<SecondaryComparison | null> => {
    try {
      const { data, error } = await (supabase
        .from('secondary_comparisons') as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return parseDbRecord(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      return null;
    }
  };

  // Generate share token
  const generateShareToken = async (id: string): Promise<string | null> => {
    const token = crypto.randomUUID();
    
    try {
      const { error } = await (supabase
        .from('secondary_comparisons') as any)
        .update({ share_token: token, is_public: true })
        .eq('id', id);

      if (error) throw error;

      setComparisons(prev => prev.map(c => 
        c.id === id ? { ...c, share_token: token, is_public: true } : c
      ));
      toast.success('Share link generated');
      return token;
    } catch (error) {
      console.error('Error generating share token:', error);
      toast.error('Error generating share link');
      return null;
    }
  };

  return {
    comparisons,
    loading,
    saveComparison,
    updateComparison,
    deleteComparison,
    loadComparison,
    generateShareToken,
    refetch: fetchComparisons,
  };
};

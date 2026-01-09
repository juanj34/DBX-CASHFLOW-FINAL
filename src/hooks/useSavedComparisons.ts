import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { InvestmentFocus } from '@/hooks/useRecommendationEngine';

export interface SavedComparison {
  id: string;
  broker_id: string;
  title: string;
  description: string | null;
  quote_ids: string[];
  investment_focus: string | null;
  show_recommendations: boolean;
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveComparisonInput {
  title: string;
  description?: string;
  quoteIds: string[];
  investmentFocus?: InvestmentFocus | null;
  showRecommendations?: boolean;
}

export const useSavedComparisons = () => {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisons = async () => {
    if (!user) {
      setComparisons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('saved_comparisons')
      .select('*')
      .eq('broker_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved comparisons:', error);
      setComparisons([]);
    } else {
      setComparisons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComparisons();
  }, [user]);

  const saveComparison = async (input: SaveComparisonInput): Promise<{ id: string | null; error: string | null }> => {
    if (!user) return { id: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('saved_comparisons')
      .insert({
        broker_id: user.id,
        title: input.title,
        description: input.description || null,
        quote_ids: input.quoteIds,
        investment_focus: input.investmentFocus || null,
        show_recommendations: input.showRecommendations ?? true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving comparison:', error);
      return { id: null, error: error.message };
    }

    await fetchComparisons();
    return { id: data?.id || null, error: null };
  };

  const updateComparison = async (
    id: string,
    updates: Partial<SaveComparisonInput>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    const updateData: Record<string, any> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.quoteIds !== undefined) updateData.quote_ids = updates.quoteIds;
    if (updates.investmentFocus !== undefined) updateData.investment_focus = updates.investmentFocus;
    if (updates.showRecommendations !== undefined) updateData.show_recommendations = updates.showRecommendations;

    const { error } = await supabase
      .from('saved_comparisons')
      .update(updateData)
      .eq('id', id)
      .eq('broker_id', user.id);

    if (error) {
      console.error('Error updating comparison:', error);
      return { error: error.message };
    }

    await fetchComparisons();
    return { error: null };
  };

  const deleteComparison = async (id: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('saved_comparisons')
      .delete()
      .eq('id', id)
      .eq('broker_id', user.id);

    if (error) {
      console.error('Error deleting comparison:', error);
      return { error: error.message };
    }

    await fetchComparisons();
    return { error: null };
  };

  const generateShareToken = async (id: string): Promise<{ shareToken: string | null; error: string | null }> => {
    if (!user) return { shareToken: null, error: 'Not authenticated' };

    // Generate a random token
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const { error } = await supabase
      .from('saved_comparisons')
      .update({ share_token: token, is_public: true })
      .eq('id', id)
      .eq('broker_id', user.id);

    if (error) {
      console.error('Error generating share token:', error);
      return { shareToken: null, error: error.message };
    }

    await fetchComparisons();
    return { shareToken: token, error: null };
  };

  const getComparisonByShareToken = async (token: string): Promise<SavedComparison | null> => {
    const { data, error } = await supabase
      .from('saved_comparisons')
      .select('*')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching shared comparison:', error);
      return null;
    }

    return data;
  };

  return {
    comparisons,
    loading,
    saveComparison,
    updateComparison,
    deleteComparison,
    generateShareToken,
    getComparisonByShareToken,
    refetch: fetchComparisons,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SavedComparison } from './useSavedComparisons';
import { SecondaryComparison } from './useSecondaryComparisons';
import { SecondaryInputs, DEFAULT_SECONDARY_INPUTS } from '@/components/roi/secondary/types';

// Re-export types for convenience
export type { SavedComparison } from './useSavedComparisons';
export type { SecondaryComparison } from './useSecondaryComparisons';

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
  client_id: string | null;
}

const parseSecondaryRecord = (record: DbSecondaryComparison): SecondaryComparison => ({
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

/**
 * Hook to fetch comparisons for a specific client
 * Can be used with either a clientId (broker access) or portalToken (client portal access)
 */
export const useClientComparisons = (options: { clientId?: string; portalToken?: string }) => {
  const { clientId, portalToken } = options;
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [secondaryComparisons, setSecondaryComparisons] = useState<SecondaryComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisons = useCallback(async () => {
    setLoading(true);

    let resolvedClientId = clientId;

    // If using portal token, first resolve to client ID
    if (!resolvedClientId && portalToken) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('portal_token', portalToken)
        .eq('portal_enabled', true)
        .single();

      if (clientError || !client) {
        setSavedComparisons([]);
        setSecondaryComparisons([]);
        setLoading(false);
        return;
      }
      resolvedClientId = client.id;
    }

    if (!resolvedClientId) {
      setSavedComparisons([]);
      setSecondaryComparisons([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch saved comparisons (quote comparisons)
      const { data: savedData, error: savedError } = await supabase
        .from('saved_comparisons')
        .select('*')
        .eq('client_id', resolvedClientId)
        .order('updated_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved comparisons:', savedError);
      } else {
        setSavedComparisons((savedData || []) as SavedComparison[]);
      }

      // Fetch secondary comparisons (off-plan vs secondary)
      const { data: secondaryData, error: secondaryError } = await (supabase
        .from('secondary_comparisons') as any)
        .select('*')
        .eq('client_id', resolvedClientId)
        .order('updated_at', { ascending: false });

      if (secondaryError) {
        console.error('Error fetching secondary comparisons:', secondaryError);
      } else {
        setSecondaryComparisons((secondaryData || []).map(parseSecondaryRecord));
      }
    } catch (error) {
      console.error('Error fetching client comparisons:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId, portalToken]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  const totalComparisons = savedComparisons.length + secondaryComparisons.length;

  return {
    savedComparisons,
    secondaryComparisons,
    totalComparisons,
    loading,
    refetch: fetchComparisons,
  };
};

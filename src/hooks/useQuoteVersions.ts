import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;
  inputs: Record<string, any>;
  title: string | null;
  client_name: string | null;
  client_email: string | null;
  client_country: string | null;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  unit_size_sqf: number | null;
  unit_size_m2: number | null;
  created_at: string;
}

export const useQuoteVersions = (quoteId?: string) => {
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVersions = useCallback(async () => {
    if (!quoteId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_versions')
        .select('*')
        .eq('quote_id', quoteId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching versions:', error);
        return;
      }

      setVersions((data as QuoteVersion[]) || []);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  const saveVersion = useCallback(async (currentQuoteData: {
    inputs: Record<string, any>;
    title?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    client_country?: string | null;
    project_name?: string | null;
    developer?: string | null;
    unit?: string | null;
    unit_type?: string | null;
    unit_size_sqf?: number | null;
    unit_size_m2?: number | null;
  }) => {
    if (!quoteId) return null;

    try {
      // Get current version count
      const { count } = await supabase
        .from('quote_versions')
        .select('*', { count: 'exact', head: true })
        .eq('quote_id', quoteId);

      const versionNumber = (count || 0) + 1;

      const { data, error } = await supabase
        .from('quote_versions')
        .insert({
          quote_id: quoteId,
          version_number: versionNumber,
          inputs: currentQuoteData.inputs,
          title: currentQuoteData.title,
          client_name: currentQuoteData.client_name,
          client_email: currentQuoteData.client_email,
          client_country: currentQuoteData.client_country,
          project_name: currentQuoteData.project_name,
          developer: currentQuoteData.developer,
          unit: currentQuoteData.unit,
          unit_type: currentQuoteData.unit_type,
          unit_size_sqf: currentQuoteData.unit_size_sqf,
          unit_size_m2: currentQuoteData.unit_size_m2,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving version:', error);
        return null;
      }

      return data as QuoteVersion;
    } catch (err) {
      console.error('Error in saveVersion:', err);
      return null;
    }
  }, [quoteId]);

  const restoreVersion = useCallback(async (versionId: string) => {
    try {
      // Fetch the version to restore
      const { data: version, error: fetchError } = await supabase
        .from('quote_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError || !version) {
        toast({ 
          title: 'Error loading version', 
          description: fetchError?.message, 
          variant: 'destructive' 
        });
        return null;
      }

      // Update the main quote with the version data
      const { data: updatedQuote, error: updateError } = await supabase
        .from('cashflow_quotes')
        .update({
          inputs: version.inputs,
          title: version.title,
          client_name: version.client_name,
          client_email: version.client_email,
          client_country: version.client_country,
          project_name: version.project_name,
          developer: version.developer,
          unit: version.unit,
          unit_type: version.unit_type,
          unit_size_sqf: version.unit_size_sqf,
          unit_size_m2: version.unit_size_m2,
        })
        .eq('id', version.quote_id)
        .select()
        .single();

      if (updateError) {
        toast({ 
          title: 'Error restoring version', 
          description: updateError.message, 
          variant: 'destructive' 
        });
        return null;
      }

      toast({ title: 'Version restored successfully' });
      return updatedQuote;
    } catch (err) {
      console.error('Error in restoreVersion:', err);
      toast({ title: 'Error restoring version', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  return {
    versions,
    loading,
    fetchVersions,
    saveVersion,
    restoreVersion,
  };
};

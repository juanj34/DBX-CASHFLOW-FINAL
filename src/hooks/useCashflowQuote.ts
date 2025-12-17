import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OIInputs } from '@/components/roi/useOICalculations';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { useToast } from '@/hooks/use-toast';

export interface CashflowQuote {
  id: string;
  broker_id: string;
  share_token: string | null;
  client_name: string | null;
  client_country: string | null;
  client_email: string | null;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  unit_size_sqf: number | null;
  unit_size_m2: number | null;
  inputs: OIInputs;
  title: string | null;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'cashflow_quote_draft';

export const useCashflowQuote = (quoteId?: string) => {
  const [quote, setQuote] = useState<CashflowQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load quote from database or localStorage
  useEffect(() => {
    const loadQuote = async () => {
      if (quoteId) {
        const { data, error } = await supabase
          .from('cashflow_quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (!error && data) {
          setQuote({
            ...data,
            inputs: data.inputs as unknown as OIInputs
          });
        }
      } else {
        // Load from localStorage for new quotes
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setQuote(parsed);
          } catch (e) {
            console.error('Failed to parse saved quote:', e);
          }
        }
      }
      setLoading(false);
    };

    loadQuote();
  }, [quoteId]);

  // Save to localStorage as draft
  const saveDraft = useCallback((inputs: OIInputs, clientInfo: ClientUnitData) => {
    const draft = {
      inputs,
      client_name: clientInfo.clientName,
      client_country: clientInfo.clientCountry,
      project_name: clientInfo.projectName,
      developer: clientInfo.developer,
      unit: clientInfo.unit,
      unit_type: clientInfo.unitType,
      unit_size_sqf: clientInfo.unitSizeSqf,
      unit_size_m2: clientInfo.unitSizeM2,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
  }, []);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback((inputs: OIInputs, clientInfo: ClientUnitData, existingQuoteId?: string) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    // Always save to localStorage immediately
    saveDraft(inputs, clientInfo);

    autoSaveTimeout.current = setTimeout(async () => {
      if (existingQuoteId) {
        await saveQuote(inputs, clientInfo, existingQuoteId);
      }
    }, 3000);
  }, [saveDraft]);

  // Save quote to database
  const saveQuote = async (inputs: OIInputs, clientInfo: ClientUnitData, existingId?: string) => {
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Please login to save', variant: 'destructive' });
      setSaving(false);
      return null;
    }

    const quoteData = {
      broker_id: user.id,
      inputs: inputs as any,
      client_name: clientInfo.clientName || null,
      client_country: clientInfo.clientCountry || null,
      project_name: clientInfo.projectName || null,
      developer: clientInfo.developer || null,
      unit: clientInfo.unit || null,
      unit_type: clientInfo.unitType || null,
      unit_size_sqf: clientInfo.unitSizeSqf || null,
      unit_size_m2: clientInfo.unitSizeM2 || null,
      is_draft: false,
      title: clientInfo.clientName 
        ? `${clientInfo.projectName || clientInfo.developer || 'Quote'} - ${clientInfo.clientName}`
        : 'Untitled Quote',
    };

    let result;
    if (existingId) {
      result = await supabase
        .from('cashflow_quotes')
        .update(quoteData)
        .eq('id', existingId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('cashflow_quotes')
        .insert(quoteData)
        .select()
        .single();
    }

    setSaving(false);

    if (result.error) {
      toast({ title: 'Failed to save', description: result.error.message, variant: 'destructive' });
      return null;
    }

    setQuote({
      ...result.data,
      inputs: result.data.inputs as OIInputs
    });
    setLastSaved(new Date());
    
    // Clear localStorage draft after saving to DB
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    return result.data;
  };

  // Save as new quote
  const saveAsNew = async (inputs: OIInputs, clientInfo: ClientUnitData) => {
    return saveQuote(inputs, clientInfo);
  };

  // Generate share token
  const generateShareToken = async (quoteIdToShare: string) => {
    const token = crypto.randomUUID().slice(0, 12);
    
    const { error } = await supabase
      .from('cashflow_quotes')
      .update({ share_token: token })
      .eq('id', quoteIdToShare);

    if (error) {
      toast({ title: 'Failed to generate share link', variant: 'destructive' });
      return null;
    }

    return token;
  };

  // Load from localStorage draft
  const loadDraft = (): { inputs?: OIInputs; clientInfo?: Partial<ClientUnitData> } | null => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          inputs: parsed.inputs,
          clientInfo: {
            clientName: parsed.client_name || '',
            clientCountry: parsed.client_country || '',
            projectName: parsed.project_name || '',
            developer: parsed.developer || '',
            unit: parsed.unit || '',
            unitType: parsed.unit_type || '',
            unitSizeSqf: parsed.unit_size_sqf || 0,
            unitSizeM2: parsed.unit_size_m2 || 0,
          }
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return {
    quote,
    loading,
    saving,
    lastSaved,
    saveQuote,
    saveAsNew,
    scheduleAutoSave,
    generateShareToken,
    loadDraft,
  };
};

// Hook for listing all quotes
export const useQuotesList = () => {
  const [quotes, setQuotes] = useState<CashflowQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cashflow_quotes')
        .select('*')
        .eq('broker_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setQuotes(data.map(q => ({ ...q, inputs: q.inputs as unknown as OIInputs })));
      }
      setLoading(false);
    };

    fetchQuotes();
  }, []);

  const deleteQuote = async (id: string) => {
    const { error } = await supabase
      .from('cashflow_quotes')
      .delete()
      .eq('id', id);

    if (!error) {
      setQuotes(prev => prev.filter(q => q.id !== id));
    }
    return { error };
  };

  return { quotes, loading, deleteQuote, refetch: () => setLoading(true) };
};

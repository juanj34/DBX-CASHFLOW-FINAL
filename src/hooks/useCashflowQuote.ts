import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OIInputs } from '@/components/roi/useOICalculations';
import { migrateInputs, CURRENT_SCHEMA_VERSION } from '@/components/roi/inputMigration';
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
          // Migrate inputs when loading from database
          const migratedInputs = migrateInputs(data.inputs as unknown as Partial<OIInputs>);
          setQuote({
            ...data,
            inputs: migratedInputs
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
    // Get first client for backward compatibility with DB
    const firstClient = clientInfo.clients?.[0];
    const draft = {
      inputs,
      clientInfo, // Save full clientInfo with clients array
      client_name: firstClient?.name || clientInfo.clientName || '',
      client_country: firstClient?.country || clientInfo.clientCountry || '',
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
    }, 15000);
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

    // Get first client for DB (backward compatibility - DB stores single client)
    const firstClient = clientInfo.clients?.[0];
    const clientName = firstClient?.name || clientInfo.clientName || null;
    const clientCountry = firstClient?.country || clientInfo.clientCountry || null;

    // Build title from clients
    const clientNames = clientInfo.clients?.map(c => c.name).filter(Boolean).join(', ');
    const titleClientPart = clientNames || clientName || '';

    // Store clients array inside inputs for persistence + stamp schema version
    const inputsWithClients = {
      ...inputs,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      _clients: clientInfo.clients || [],
      _clientInfo: {
        developer: clientInfo.developer,
        projectName: clientInfo.projectName,
        unit: clientInfo.unit,
        unitType: clientInfo.unitType,
        unitSizeSqf: clientInfo.unitSizeSqf,
        unitSizeM2: clientInfo.unitSizeM2,
        brokerName: clientInfo.brokerName,
        splitEnabled: clientInfo.splitEnabled,
        clientShares: clientInfo.clientShares,
      }
    };

    const quoteData = {
      broker_id: user.id,
      inputs: inputsWithClients as any,
      client_name: clientName,
      client_country: clientCountry,
      project_name: clientInfo.projectName || null,
      developer: clientInfo.developer || null,
      unit: clientInfo.unit || null,
      unit_type: clientInfo.unitType || null,
      unit_size_sqf: clientInfo.unitSizeSqf || null,
      unit_size_m2: clientInfo.unitSizeM2 || null,
      is_draft: false,
      title: titleClientPart 
        ? `${clientInfo.projectName || clientInfo.developer || 'Quote'} - ${titleClientPart}`
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
        // Support both new clientInfo format and legacy format
        if (parsed.clientInfo) {
          return {
            // Migrate inputs from draft to ensure all fields have defaults
            inputs: migrateInputs(parsed.inputs),
            clientInfo: parsed.clientInfo,
          };
        }
        // Legacy format migration
        return {
          inputs: migrateInputs(parsed.inputs),
          clientInfo: {
            clients: parsed.client_name 
              ? [{ id: '1', name: parsed.client_name, country: parsed.client_country || '' }]
              : [],
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

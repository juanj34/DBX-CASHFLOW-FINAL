import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OIInputs } from '@/components/roi/useOICalculations';
import { migrateInputs, CURRENT_SCHEMA_VERSION } from '@/components/roi/inputMigration';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { MortgageInputs } from '@/components/roi/useMortgageCalculations';
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
  status: string | null;
  status_changed_at: string | null;
  presented_at: string | null;
  negotiation_started_at: string | null;
  sold_at: string | null;
  view_count: number | null;
  first_viewed_at: string | null;
}

const LOCAL_STORAGE_KEY = 'cashflow_quote_draft';

export interface QuoteImages {
  floorPlanUrl: string | null;
  buildingRenderUrl: string | null;
  heroImageUrl: string | null;
  showLogoOverlay: boolean;
}

export const useCashflowQuote = (quoteId?: string) => {
  const [quote, setQuote] = useState<CashflowQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [quoteImages, setQuoteImages] = useState<QuoteImages>({
    floorPlanUrl: null,
    buildingRenderUrl: null,
    heroImageUrl: null,
    showLogoOverlay: true,
  });
  const { toast } = useToast();
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load quote from database or localStorage
  useEffect(() => {
    // Reset state immediately when quoteId changes to avoid stale data + accidental overwrites
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = null;
    }

    setQuote(null);
    setLoading(true);
    setLastSaved(null);

    const loadQuote = async () => {
      try {
        if (quoteId) {
          // Load quote data
          const { data, error } = await supabase
            .from('cashflow_quotes')
            .select('*')
            .eq('id', quoteId)
            .maybeSingle();

          if (!error && data) {
            // Migrate inputs when loading from database
            const migratedInputs = migrateInputs(data.inputs as unknown as Partial<OIInputs>);
            setQuote({
              ...data,
              inputs: migratedInputs,
            });
            
            // Load images from cashflow_images table
            const { data: imagesData } = await supabase
              .from('cashflow_images')
              .select('image_type, image_url')
              .eq('quote_id', quoteId);
            
            if (imagesData) {
              const floorPlan = imagesData.find(img => img.image_type === 'floor_plan');
              const buildingRender = imagesData.find(img => img.image_type === 'building_render');
              const heroImage = imagesData.find(img => img.image_type === 'hero_image');
              setQuoteImages({
                floorPlanUrl: floorPlan?.image_url || null,
                buildingRenderUrl: buildingRender?.image_url || null,
                heroImageUrl: heroImage?.image_url || null,
                showLogoOverlay: true,
              });
            }
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
      } finally {
        setLoading(false);
      }
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

  // Save quote to database (with version snapshot for existing quotes)
  const saveQuote = useCallback(
    async (
      inputs: OIInputs,
      clientInfo: ClientUnitData,
      existingId?: string,
      exitScenarios?: number[],
      mortgageInputs?: MortgageInputs,
      saveVersionFn?: (data: any) => Promise<any>,
      images?: { floorPlanUrl?: string | null; buildingRenderUrl?: string | null; heroImageUrl?: string | null }
    ) => {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const clientNames = clientInfo.clients?.map((c) => c.name).filter(Boolean).join(', ');
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
          zoneId: clientInfo.zoneId,
          zoneName: clientInfo.zoneName,
        },
        _exitScenarios: exitScenarios || [],
        _mortgageInputs: mortgageInputs,
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
        // Save current version BEFORE overwriting (only for manual saves)
        if (saveVersionFn && quote) {
          await saveVersionFn({
            inputs: quote.inputs,
            title: quote.title,
            client_name: quote.client_name,
            client_email: quote.client_email,
            client_country: quote.client_country,
            project_name: quote.project_name,
            developer: quote.developer,
            unit: quote.unit,
            unit_type: quote.unit_type,
            unit_size_sqf: quote.unit_size_sqf,
            unit_size_m2: quote.unit_size_m2,
          });
        }

        result = await supabase
          .from('cashflow_quotes')
          .update(quoteData)
          .eq('id', existingId)
          .select()
          .single();
      } else {
        result = await supabase.from('cashflow_quotes').insert(quoteData).select().single();
      }

      setSaving(false);

      if (result.error) {
        toast({ title: 'Failed to save', description: result.error.message, variant: 'destructive' });
        return null;
      }

      const savedQuoteId = result.data.id;
      
      // Save images to cashflow_images table if provided
      if (images && savedQuoteId) {
        // Delete existing images for this quote first
        await supabase
          .from('cashflow_images')
          .delete()
          .eq('quote_id', savedQuoteId);
        
        // Insert new images
        const imagesToInsert = [];
        if (images.floorPlanUrl) {
          imagesToInsert.push({
            quote_id: savedQuoteId,
            image_type: 'floor_plan',
            image_url: images.floorPlanUrl,
          });
        }
        if (images.buildingRenderUrl) {
          imagesToInsert.push({
            quote_id: savedQuoteId,
            image_type: 'building_render',
            image_url: images.buildingRenderUrl,
          });
        }
        if (images.heroImageUrl) {
          imagesToInsert.push({
            quote_id: savedQuoteId,
            image_type: 'hero_image',
            image_url: images.heroImageUrl,
          });
        }
        
        if (imagesToInsert.length > 0) {
          await supabase.from('cashflow_images').insert(imagesToInsert);
        }
        
        // Update local state
        setQuoteImages({
          floorPlanUrl: images.floorPlanUrl || null,
          buildingRenderUrl: images.buildingRenderUrl || null,
          heroImageUrl: images.heroImageUrl || null,
          showLogoOverlay: true,
        });
      }

      setQuote({
        ...result.data,
        inputs: result.data.inputs as OIInputs,
      });
      setLastSaved(new Date());

      // Clear localStorage draft after saving to DB
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      return result.data;
    },
    [toast]
  );

  // Auto-save with debounce - uses _exitScenarios from inputs as source of truth
  const scheduleAutoSave = useCallback(
    (
      inputs: OIInputs,
      clientInfo: ClientUnitData,
      existingQuoteId?: string,
      isQuoteConfigured?: boolean,
      mortgageInputs?: MortgageInputs,
      images?: { floorPlanUrl: string | null; buildingRenderUrl: string | null; heroImageUrl: string | null },
      onNewQuoteCreated?: (newId: string) => void,
      suppressToast?: boolean
    ) => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }

      // Always save to localStorage immediately
      saveDraft(inputs, clientInfo);

      // Capture the intended target quote id for this autosave cycle
      const targetExistingId = existingQuoteId;

      // Only schedule database auto-save for existing quotes
      if (!targetExistingId) {
        return; // New quotes only saved to localStorage draft above
      }

      autoSaveTimeout.current = setTimeout(async () => {
        // Safety check - ensure we're still on the same quote
        if (quote?.id !== targetExistingId) {
          return;
        }

        const exitScenarios = inputs._exitScenarios || [];
        console.log('Auto-saving existing quote:', targetExistingId);
        await saveQuote(inputs, clientInfo, targetExistingId, exitScenarios, mortgageInputs, undefined, images);
      }, 15000);
    },
    [saveDraft, toast, quote?.id, saveQuote]
  );

  // Save as new quote
  const saveAsNew = async (inputs: OIInputs, clientInfo: ClientUnitData, exitScenarios?: number[], mortgageInputs?: MortgageInputs, images?: { floorPlanUrl?: string | null; buildingRenderUrl?: string | null; heroImageUrl?: string | null }) => {
    return saveQuote(inputs, clientInfo, undefined, exitScenarios, mortgageInputs, undefined, images);
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
    quoteImages,
    setQuoteImages,
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
        .or('is_archived.is.null,is_archived.eq.false')
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

  const archiveQuote = async (id: string) => {
    const { error } = await supabase
      .from('cashflow_quotes')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setQuotes(prev => prev.filter(q => q.id !== id));
    }
    return { error };
  };

  const duplicateQuote = async (id: string): Promise<{ newId: string | null; error: any }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { newId: null, error: new Error('Not authenticated') };
    }

    // Fetch the original quote
    const { data: originalQuote, error: fetchError } = await supabase
      .from('cashflow_quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalQuote) {
      return { newId: null, error: fetchError };
    }

    // Create a copy with modified title
    const originalTitle = originalQuote.title || 'Untitled Quote';
    const newTitle = `${originalTitle} (Copy)`;

    const { data: newQuote, error: insertError } = await supabase
      .from('cashflow_quotes')
      .insert({
        broker_id: user.id,
        inputs: originalQuote.inputs,
        client_name: originalQuote.client_name,
        client_country: originalQuote.client_country,
        client_email: originalQuote.client_email,
        project_name: originalQuote.project_name,
        developer: originalQuote.developer,
        unit: originalQuote.unit,
        unit_type: originalQuote.unit_type,
        unit_size_sqf: originalQuote.unit_size_sqf,
        unit_size_m2: originalQuote.unit_size_m2,
        title: newTitle,
        is_draft: true,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError || !newQuote) {
      return { newId: null, error: insertError };
    }

    // Copy images if any exist
    const { data: images } = await supabase
      .from('cashflow_images')
      .select('image_type, image_url')
      .eq('quote_id', id);

    if (images && images.length > 0) {
      await supabase.from('cashflow_images').insert(
        images.map(img => ({
          quote_id: newQuote.id,
          image_type: img.image_type,
          image_url: img.image_url,
        }))
      );
    }

    // Add the new quote to local state
    setQuotes(prev => [{
      ...newQuote,
      inputs: newQuote.inputs as unknown as OIInputs,
    }, ...prev]);

    return { newId: newQuote.id, error: null };
  };

  return { quotes, loading, deleteQuote, archiveQuote, duplicateQuote, refetch: () => setLoading(true) };
};

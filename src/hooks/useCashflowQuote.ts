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

// Removed: localStorage draft system - now using immediate database persistence

export interface QuoteImages {
  floorPlanUrl: string | null;
  buildingRenderUrl: string | null;
  heroImageUrl: string | null;
  showLogoOverlay: boolean;
}

// Helper function to check if a quote has meaningful content
export const hasWorkingDraftContent = (quote: CashflowQuote | null): boolean => {
  if (!quote) return false;
  const inputs = quote.inputs as any;
  return Boolean(
    quote.client_name ||
    quote.project_name ||
    quote.developer ||
    (inputs?.basePrice && inputs.basePrice > 0)
  );
};

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

  // Load quote from database
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
          // Load quote data with explicit columns (avoid select('*') for schema stability)
          const { data, error } = await supabase
            .from('cashflow_quotes')
            .select(`
              id, broker_id, share_token, client_name, client_country, client_email,
              project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
              inputs, title, created_at, updated_at, status, status_changed_at,
              presented_at, negotiation_started_at, sold_at, view_count, first_viewed_at,
              is_archived, archived_at, last_viewed_at, client_id
            `)
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
        }
        // No localStorage fallback - drafts are created immediately in DB
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  // Get or create user's single working draft (atomic — database unique index prevents duplicates)
  const getOrCreateWorkingDraft = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please login to create a quote', variant: 'destructive' });
        return null;
      }

      // Fast path: find existing working draft
      const { data: existingDraft } = await supabase
        .from('cashflow_quotes')
        .select('id')
        .eq('broker_id', user.id)
        .eq('status', 'working_draft')
        .maybeSingle();

      if (existingDraft) {
        console.log('[getOrCreateWorkingDraft] Found existing:', existingDraft.id);
        return existingDraft.id;
      }

      // No existing draft — create one.
      // The partial unique index (idx_unique_working_draft_per_broker) guarantees at most
      // one working_draft per broker. If a concurrent call already inserted one, the INSERT
      // will fail with a unique constraint violation (23505) and we fall back to SELECT.
      const { data, error } = await supabase
        .from('cashflow_quotes')
        .insert({
          broker_id: user.id,
          inputs: {} as any,
          status: 'working_draft',
          title: null,
        })
        .select('id')
        .single();

      if (error) {
        // Handle unique constraint violation: another call created the draft concurrently
        if (error.code === '23505') {
          console.log('[getOrCreateWorkingDraft] Concurrent creation detected, fetching existing...');
          const { data: raceDraft } = await supabase
            .from('cashflow_quotes')
            .select('id')
            .eq('broker_id', user.id)
            .eq('status', 'working_draft')
            .maybeSingle();
          if (raceDraft) return raceDraft.id;
        }
        console.error('[getOrCreateWorkingDraft] Failed:', error);
        toast({ title: 'Failed to create draft', variant: 'destructive' });
        return null;
      }

      console.log('[getOrCreateWorkingDraft] Created new:', data.id);
      return data.id;
    } catch (err) {
      console.error('[getOrCreateWorkingDraft] Error:', err);
      return null;
    }
  }, [toast]);

  // Promote working draft to a real draft (when user explicitly saves)
  const promoteWorkingDraft = useCallback(async (workingDraftId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('cashflow_quotes')
      .update({ status: 'draft' })
      .eq('id', workingDraftId)
      .eq('status', 'working_draft');

    if (error) {
      console.error('Failed to promote working draft:', error);
      return false;
    }
    
    console.log('Promoted working draft to draft:', workingDraftId);
    return true;
  }, []);

  // Clear working draft content (reset for new quote) - also resets local state
  const clearWorkingDraft = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Cancel any pending auto-save
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = null;
    }

    // DELETE the working draft entirely so getOrCreateWorkingDraft() creates a fresh row
    await supabase
      .from('cashflow_quotes')
      .delete()
      .eq('broker_id', user.id)
      .eq('status', 'working_draft');

    // CRITICAL: Also reset local state to prevent stale data
    setQuote(null);
    setQuoteImages({
      floorPlanUrl: null,
      buildingRenderUrl: null,
      heroImageUrl: null,
      showLogoOverlay: true,
    });
    setLastSaved(null);
    
    console.log('Cleared working draft content and local state');
  }, []);

  // Removed: saveDraft localStorage function - now using immediate database persistence

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
      // GUARD: Check for meaningful content before saving
      // This prevents "Untitled Quote" entries from empty configurations
      const hasMinimumContent = 
        (inputs.basePrice > 0) ||
        (clientInfo.projectName?.trim()) ||
        (clientInfo.developer?.trim()) ||
        (clientInfo.clients?.some(c => c.name?.trim()));
      
      if (!hasMinimumContent) {
        console.log('[saveQuote] Skipping save - no meaningful content');
        return null;
      }

      setSaving(true);

      // Safety check: Prevent saving with mismatched quote IDs to avoid data corruption
      if (existingId && quote?.id && existingId !== quote.id) {
        console.warn('Quote ID mismatch detected - aborting save to prevent data corruption');
        console.warn('Attempted to save to:', existingId, 'but current quote is:', quote.id);
        setSaving(false);
        return null;
      }

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
          dbClientId: clientInfo.dbClientId, // Persist the database client link
        },
        _exitScenarios: exitScenarios || [],
        _mortgageInputs: mortgageInputs,
      };

      // Generate title - avoid "Untitled Quote" for working drafts
      const generatedTitle = titleClientPart
        ? `${clientInfo.projectName || clientInfo.developer || 'Quote'} - ${titleClientPart}`
        : clientInfo.projectName || clientInfo.developer || null;

      const quoteData = {
        broker_id: user.id,
        inputs: inputsWithClients as any,
        client_name: clientName,
        client_country: clientCountry,
        client_id: clientInfo.dbClientId || null, // Link to database client
        project_name: clientInfo.projectName || null,
        developer: clientInfo.developer || null,
        unit: clientInfo.unit || null,
        unit_type: clientInfo.unitType || null,
        unit_size_sqf: clientInfo.unitSizeSqf || null,
        unit_size_m2: clientInfo.unitSizeM2 || null,
        // Only use "Untitled Quote" as absolute fallback for non-working-draft quotes
        title: generatedTitle || (quote?.status === 'working_draft' ? null : 'Untitled Quote'),
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
        result = await supabase.from('cashflow_quotes').insert({ ...quoteData, status: 'draft' }).select().single();
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

      return result.data;
    },
    [toast, quote?.id]
  );

  // Auto-save with debounce — only UPDATES existing quotes, never creates new ones.
  // Quote creation is explicit (via getOrCreateWorkingDraft), like Google Docs.
  const scheduleAutoSave = useCallback(
    (
      inputs: OIInputs,
      clientInfo: ClientUnitData,
      existingQuoteId?: string,
      mortgageInputs?: MortgageInputs,
      images?: { floorPlanUrl: string | null; buildingRenderUrl: string | null; heroImageUrl: string | null },
    ) => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }

      // No quote ID → nothing to update. Auto-save never creates.
      if (!existingQuoteId) {
        return;
      }

      autoSaveTimeout.current = setTimeout(async () => {
        // Safety: ensure we're still on the same quote (prevents stale saves after navigation)
        if (quote?.id !== existingQuoteId) {
          console.log('[scheduleAutoSave] Stale save prevented:', existingQuoteId, '!==', quote?.id);
          return;
        }

        const exitScenarios = inputs._exitScenarios || [];
        console.log('[scheduleAutoSave] Updating quote:', existingQuoteId);
        await saveQuote(inputs, clientInfo, existingQuoteId, exitScenarios, mortgageInputs, undefined, images);
      }, 1500);
    },
    [quote?.id, saveQuote]
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

  // Removed: loadDraft localStorage function - now using immediate database persistence

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
    getOrCreateWorkingDraft,
    promoteWorkingDraft,
    clearWorkingDraft,
  };
};

// Hook for listing all quotes
export const useQuotesList = () => {
  const [quotes, setQuotes] = useState<CashflowQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchQuotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cashflow_quotes')
        .select(`
          id, broker_id, share_token, client_name, client_country, client_email,
          project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
          inputs, title, created_at, updated_at, status, status_changed_at,
          presented_at, negotiation_started_at, sold_at, view_count, first_viewed_at,
          is_archived, archived_at, last_viewed_at
        `)
        .eq('broker_id', user.id)
        .neq('status', 'working_draft')
        .or('is_archived.is.null,is_archived.eq.false')
        .order('updated_at', { ascending: false })
        .limit(150);

      if (!error && data) {
        setQuotes(data.map(q => ({ ...q, inputs: q.inputs as unknown as OIInputs })));
        setLastFetched(new Date());
      } else if (error) {
        console.error('Failed to fetch quotes:', error);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Auto-refresh when tab regains visibility (syncs changes from other tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastFetched) {
        const timeSinceLastFetch = Date.now() - lastFetched.getTime();
        // Refresh if more than 3 seconds have passed
        if (timeSinceLastFetch > 3000) {
          fetchQuotes();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastFetched, fetchQuotes]);

  // Also refresh on window focus (covers more edge cases)
  useEffect(() => {
    const handleFocus = () => {
      if (lastFetched) {
        const timeSinceLastFetch = Date.now() - lastFetched.getTime();
        if (timeSinceLastFetch > 3000) {
          fetchQuotes();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastFetched, fetchQuotes]);

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

    // Fetch the original quote with explicit columns
    const { data: originalQuote, error: fetchError } = await supabase
      .from('cashflow_quotes')
      .select(`
        id, broker_id, share_token, client_name, client_country, client_email,
        project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
        inputs, title, created_at, updated_at, status
      `)
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

  return { quotes, setQuotes, loading, lastFetched, refetch: fetchQuotes, deleteQuote, archiveQuote, duplicateQuote };
};

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface PreselectedClient {
  dbClientId: string;
  clientName?: string;
  clientEmail?: string;
  clientCountry?: string;
}

export interface StartNewQuoteOptions {
  preselectedClient?: PreselectedClient;
  openConfigurator?: boolean;
  targetRoute?: 'generator' | 'dashboard';
}

/**
 * Unified hook for starting a new quote from any entry point.
 * Ensures consistent behavior: clears localStorage, resets working draft, navigates cleanly.
 */
export const useNewQuote = () => {
  const navigate = useNavigate();

  /**
   * Clear all localStorage state related to cashflow configurator
   */
  const clearLocalState = useCallback(() => {
    localStorage.removeItem('cashflow-configurator-state');
    localStorage.removeItem('cashflow-configurator-state-v2');
    localStorage.removeItem('cashflow_configurator_open');
    localStorage.removeItem('cashflow_quote_draft');
    localStorage.removeItem('preselected_client');
  }, []);

  /**
   * Clear the user's working draft content in the database (reset to empty)
   */
  const clearWorkingDraftInDb = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('cashflow_quotes')
      .update({
        inputs: {} as any,
        client_name: null,
        client_id: null,
        client_country: null,
        client_email: null,
        project_name: null,
        developer: null,
        unit: null,
        unit_type: null,
        unit_size_sqf: null,
        unit_size_m2: null,
        title: null,
      })
      .eq('broker_id', user.id)
      .eq('status', 'working_draft');
    
    console.log('[useNewQuote] Cleared working draft in DB');
  }, []);

  /**
   * Check if user has a working draft with meaningful content
   */
  const checkExistingDraft = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('cashflow_quotes')
      .select('id, project_name, developer, client_name, updated_at, inputs')
      .eq('broker_id', user.id)
      .eq('status', 'working_draft')
      .maybeSingle();

    if (!data) return null;

    // Check if it has meaningful content
    const inputs = data.inputs as any;
    const hasContent = Boolean(
      data.client_name ||
      data.project_name ||
      data.developer ||
      (inputs?.basePrice && inputs.basePrice > 0)
    );

    if (!hasContent) return null;

    return {
      id: data.id,
      projectName: data.project_name,
      developer: data.developer,
      clientName: data.client_name,
      updatedAt: data.updated_at,
    };
  }, []);

  /**
   * Start a new quote with clean state.
   * This is the main entry point that should be used everywhere.
   */
  const startNewQuote = useCallback(async (options?: StartNewQuoteOptions) => {
    const {
      preselectedClient,
      openConfigurator = true,
      targetRoute = 'generator',
    } = options || {};

    // 1. Clear all localStorage state
    clearLocalState();

    // 2. Clear working draft in DB
    await clearWorkingDraftInDb();

    // 3. Store preselected client if provided
    if (preselectedClient) {
      localStorage.setItem('preselected_client', JSON.stringify({
        dbClientId: preselectedClient.dbClientId,
        clientName: preselectedClient.clientName || '',
        clientEmail: preselectedClient.clientEmail || '',
        clientCountry: preselectedClient.clientCountry || '',
      }));
    }

    // 4. Navigate with clean state
    const route = targetRoute === 'dashboard' 
      ? '/cashflow-dashboard' 
      : '/cashflow-generator';

    navigate(route, { 
      replace: true, 
      state: { 
        openConfigurator,
        freshStart: true,
      } 
    });

    console.log('[useNewQuote] Started new quote, navigating to:', route);
  }, [navigate, clearLocalState, clearWorkingDraftInDb]);

  return {
    startNewQuote,
    checkExistingDraft,
    clearLocalState,
    clearWorkingDraftInDb,
  };
};

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AcquiredProperty {
  id: string;
  broker_id: string;
  client_id: string | null;
  source_quote_id: string | null;
  project_name: string;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  unit_size_sqf: number | null;
  purchase_price: number;
  purchase_date: string;
  acquisition_fees: number | null;
  current_value: number | null;
  last_valuation_date: string | null;
  is_rented: boolean;
  monthly_rent: number | null;
  rental_start_date: string | null;
  has_mortgage: boolean;
  mortgage_amount: number | null;
  mortgage_balance: number | null;
  mortgage_interest_rate: number | null;
  mortgage_term_years: number | null;
  monthly_mortgage_payment: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyInput {
  client_id?: string;
  source_quote_id?: string;
  project_name: string;
  developer?: string;
  unit?: string;
  unit_type?: string;
  unit_size_sqf?: number;
  purchase_price: number;
  purchase_date: string;
  acquisition_fees?: number;
  current_value?: number;
  is_rented?: boolean;
  monthly_rent?: number;
  rental_start_date?: string;
  has_mortgage?: boolean;
  mortgage_amount?: number;
  mortgage_balance?: number;
  mortgage_interest_rate?: number;
  mortgage_term_years?: number;
  monthly_mortgage_payment?: number;
  notes?: string;
}

export interface PortfolioMetrics {
  totalProperties: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalAppreciation: number;
  appreciationPercent: number;
  totalMonthlyRent: number;
  totalMortgageBalance: number;
  monthlyMortgagePayments: number;
  netMonthlyCashflow: number;
  totalEquity: number;
}

export const usePortfolio = (clientId?: string) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<AcquiredProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!user) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("acquired_properties")
        .select("*")
        .eq("broker_id", user.id)
        .order("purchase_date", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data as AcquiredProperty[]) || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, [user, clientId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = useCallback(async (input: CreatePropertyInput): Promise<AcquiredProperty | null> => {
    if (!user) {
      toast.error("You must be logged in");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("acquired_properties")
        .insert({
          broker_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;

      setProperties(prev => [data as AcquiredProperty, ...prev]);
      toast.success("Property added to portfolio");
      return data as AcquiredProperty;
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to add property");
      return null;
    }
  }, [user]);

  const updateProperty = useCallback(async (id: string, updates: Partial<CreatePropertyInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("acquired_properties")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setProperties(prev => prev.map(p =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ));
      toast.success("Property updated");
      return true;
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property");
      return false;
    }
  }, []);

  const deleteProperty = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("acquired_properties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success("Property removed");
      return true;
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to remove property");
      return false;
    }
  }, []);

  // Calculate portfolio metrics
  const metrics: PortfolioMetrics = properties.reduce((acc, p) => {
    const currentValue = p.current_value || p.purchase_price;
    const appreciation = currentValue - p.purchase_price;
    
    return {
      totalProperties: acc.totalProperties + 1,
      totalPurchaseValue: acc.totalPurchaseValue + p.purchase_price,
      totalCurrentValue: acc.totalCurrentValue + currentValue,
      totalAppreciation: acc.totalAppreciation + appreciation,
      appreciationPercent: 0, // Calculated below
      totalMonthlyRent: acc.totalMonthlyRent + (p.is_rented && p.monthly_rent ? p.monthly_rent : 0),
      totalMortgageBalance: acc.totalMortgageBalance + (p.mortgage_balance || 0),
      monthlyMortgagePayments: acc.monthlyMortgagePayments + (p.monthly_mortgage_payment || 0),
      netMonthlyCashflow: 0, // Calculated below
      totalEquity: 0, // Calculated below
    };
  }, {
    totalProperties: 0,
    totalPurchaseValue: 0,
    totalCurrentValue: 0,
    totalAppreciation: 0,
    appreciationPercent: 0,
    totalMonthlyRent: 0,
    totalMortgageBalance: 0,
    monthlyMortgagePayments: 0,
    netMonthlyCashflow: 0,
    totalEquity: 0,
  });

  // Derived calculations
  metrics.appreciationPercent = metrics.totalPurchaseValue > 0 
    ? (metrics.totalAppreciation / metrics.totalPurchaseValue) * 100 
    : 0;
  metrics.netMonthlyCashflow = metrics.totalMonthlyRent - metrics.monthlyMortgagePayments;
  metrics.totalEquity = metrics.totalCurrentValue - metrics.totalMortgageBalance;

  return {
    properties,
    loading,
    metrics,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};

// Hook for client portal access (via portal token)
export const useClientPortfolio = (portalToken: string) => {
  const [properties, setProperties] = useState<AcquiredProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!portalToken) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First get the client by portal token
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("portal_token", portalToken)
        .eq("portal_enabled", true)
        .single();

      if (clientError || !client) {
        setProperties([]);
        setLoading(false);
        return;
      }

      // Then get their properties
      const { data, error } = await supabase
        .from("acquired_properties")
        .select("*")
        .eq("client_id", client.id)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setProperties((data as AcquiredProperty[]) || []);
    } catch (error) {
      console.error("Error fetching client portfolio:", error);
    } finally {
      setLoading(false);
    }
  }, [portalToken]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Calculate portfolio metrics (same logic)
  const metrics: PortfolioMetrics = properties.reduce((acc, p) => {
    const currentValue = p.current_value || p.purchase_price;
    const appreciation = currentValue - p.purchase_price;
    
    return {
      totalProperties: acc.totalProperties + 1,
      totalPurchaseValue: acc.totalPurchaseValue + p.purchase_price,
      totalCurrentValue: acc.totalCurrentValue + currentValue,
      totalAppreciation: acc.totalAppreciation + appreciation,
      appreciationPercent: 0,
      totalMonthlyRent: acc.totalMonthlyRent + (p.is_rented && p.monthly_rent ? p.monthly_rent : 0),
      totalMortgageBalance: acc.totalMortgageBalance + (p.mortgage_balance || 0),
      monthlyMortgagePayments: acc.monthlyMortgagePayments + (p.monthly_mortgage_payment || 0),
      netMonthlyCashflow: 0,
      totalEquity: 0,
    };
  }, {
    totalProperties: 0,
    totalPurchaseValue: 0,
    totalCurrentValue: 0,
    totalAppreciation: 0,
    appreciationPercent: 0,
    totalMonthlyRent: 0,
    totalMortgageBalance: 0,
    monthlyMortgagePayments: 0,
    netMonthlyCashflow: 0,
    totalEquity: 0,
  });

  metrics.appreciationPercent = metrics.totalPurchaseValue > 0 
    ? (metrics.totalAppreciation / metrics.totalPurchaseValue) * 100 
    : 0;
  metrics.netMonthlyCashflow = metrics.totalMonthlyRent - metrics.monthlyMortgagePayments;
  metrics.totalEquity = metrics.totalCurrentValue - metrics.totalMortgageBalance;

  return { properties, loading, metrics };
};

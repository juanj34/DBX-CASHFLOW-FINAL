import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SecondaryProperty {
  id: string;
  broker_id: string;
  name: string;
  purchase_price: number;
  unit_size_sqf: number;
  closing_costs_percent: number;
  rental_yield_percent: number;
  rent_growth_rate: number;
  appreciation_rate: number;
  service_charge_per_sqft: number;
  use_mortgage: boolean;
  mortgage_financing_percent: number;
  mortgage_interest_rate: number;
  mortgage_term_years: number;
  show_airbnb: boolean;
  airbnb_adr: number | null;
  airbnb_occupancy: number | null;
  airbnb_operating_expense: number | null;
  airbnb_management_fee: number | null;
  created_at: string;
  updated_at: string;
}

export interface SecondaryPropertyInsert {
  name: string;
  purchase_price: number;
  unit_size_sqf: number;
  closing_costs_percent?: number;
  rental_yield_percent?: number;
  rent_growth_rate?: number;
  appreciation_rate?: number;
  service_charge_per_sqft?: number;
  use_mortgage?: boolean;
  mortgage_financing_percent?: number;
  mortgage_interest_rate?: number;
  mortgage_term_years?: number;
  show_airbnb?: boolean;
  airbnb_adr?: number;
  airbnb_occupancy?: number;
  airbnb_operating_expense?: number;
  airbnb_management_fee?: number;
}

export const useSecondaryProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<SecondaryProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!user?.id) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('secondary_properties')
        .select('*')
        .eq('broker_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProperties((data as SecondaryProperty[]) || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching secondary properties:', err);
      setError('Error al cargar propiedades secundarias');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = async (property: SecondaryPropertyInsert): Promise<SecondaryProperty | null> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('secondary_properties')
        .insert({
          broker_id: user.id,
          ...property,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newProperty = data as SecondaryProperty;
      setProperties(prev => [newProperty, ...prev]);
      toast.success('Propiedad guardada');
      return newProperty;
    } catch (err) {
      console.error('Error creating secondary property:', err);
      toast.error('Error al guardar propiedad');
      return null;
    }
  };

  const updateProperty = async (id: string, updates: Partial<SecondaryPropertyInsert>): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { error } = await supabase
        .from('secondary_properties')
        .update(updates)
        .eq('id', id)
        .eq('broker_id', user.id);

      if (error) throw error;
      
      setProperties(prev => 
        prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)
      );
      toast.success('Propiedad actualizada');
      return true;
    } catch (err) {
      console.error('Error updating secondary property:', err);
      toast.error('Error al actualizar propiedad');
      return false;
    }
  };

  const deleteProperty = async (id: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { error } = await supabase
        .from('secondary_properties')
        .delete()
        .eq('id', id)
        .eq('broker_id', user.id);

      if (error) throw error;
      
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Propiedad eliminada');
      return true;
    } catch (err) {
      console.error('Error deleting secondary property:', err);
      toast.error('Error al eliminar propiedad');
      return false;
    }
  };

  return {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};

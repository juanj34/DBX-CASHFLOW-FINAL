import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Client {
  id: string;
  broker_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  portal_token: string | null;
  portal_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  notes?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  notes?: string;
  portal_enabled?: boolean;
}

export const useClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("broker_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = useCallback(async (input: CreateClientInput): Promise<Client | null> => {
    if (!user) {
      toast.error("You must be logged in to create a client");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          broker_id: user.id,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          country: input.country || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Client created");
      return data;
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Failed to create client");
      return null;
    }
  }, [user]);

  const updateClient = useCallback(async (id: string, updates: UpdateClientInput): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ));
      return true;
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
      return false;
    }
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast.success("Client deleted");
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
      return false;
    }
  }, []);

  const generatePortalToken = useCallback(async (id: string): Promise<string | null> => {
    try {
      const token = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      
      const { error } = await supabase
        .from("clients")
        .update({ 
          portal_token: token,
          portal_enabled: true 
        })
        .eq("id", id);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === id ? { ...c, portal_token: token, portal_enabled: true } : c
      ));
      
      return token;
    } catch (error) {
      console.error("Error generating portal token:", error);
      toast.error("Failed to generate portal link");
      return null;
    }
  }, []);

  const getClientByPortalToken = useCallback(async (token: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("portal_token", token)
        .eq("portal_enabled", true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching client by portal token:", error);
      return null;
    }
  }, []);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    generatePortalToken,
    getClientByPortalToken,
  };
};

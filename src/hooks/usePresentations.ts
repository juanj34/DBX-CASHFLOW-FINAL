import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface PresentationItem {
  type: 'quote' | 'comparison' | 'inline_comparison';
  id: string;
  viewMode?: 'story' | 'vertical' | 'compact';
  title?: string; // For display
  quoteIds?: string[]; // For inline comparisons only
}

export interface Presentation {
  id: string;
  broker_id: string;
  title: string;
  description: string | null;
  items: PresentationItem[];
  share_token: string | null;
  is_public: boolean;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePresentationInput {
  title: string;
  description?: string;
  items?: PresentationItem[];
}

export interface UpdatePresentationInput {
  title?: string;
  description?: string;
  items?: PresentationItem[];
  is_public?: boolean;
}

export const usePresentations = () => {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresentations = useCallback(async () => {
    if (!user) {
      setPresentations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("broker_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Transform JSONB items to typed array
      const typedData = (data || []).map(p => ({
        ...p,
        items: (p.items as unknown as PresentationItem[]) || [],
      }));
      
      setPresentations(typedData);
    } catch (error) {
      console.error("Error fetching presentations:", error);
      toast.error("Failed to load presentations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  const createPresentation = useCallback(async (input: CreatePresentationInput): Promise<Presentation | null> => {
    if (!user) {
      toast.error("You must be logged in to create a presentation");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("presentations")
        .insert({
          broker_id: user.id,
          title: input.title,
          description: input.description || null,
          items: (input.items || []) as unknown as Record<string, unknown>[],
        } as never)
        .select()
        .single();

      if (error) throw error;

      const newPresentation = {
        ...data,
        items: (data.items as unknown as PresentationItem[]) || [],
      };
      
      setPresentations(prev => [newPresentation, ...prev]);
      toast.success("Presentation created");
      return newPresentation;
    } catch (error) {
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
      return null;
    }
  }, [user]);

  const updatePresentation = useCallback(async (id: string, updates: UpdatePresentationInput): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.items !== undefined) updateData.items = updates.items as unknown as Record<string, unknown>[];
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

      const { error } = await supabase
        .from("presentations")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setPresentations(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ));
      return true;
    } catch (error) {
      console.error("Error updating presentation:", error);
      toast.error("Failed to update presentation");
      return false;
    }
  }, []);

  const deletePresentation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPresentations(prev => prev.filter(p => p.id !== id));
      toast.success("Presentation deleted");
      return true;
    } catch (error) {
      console.error("Error deleting presentation:", error);
      toast.error("Failed to delete presentation");
      return false;
    }
  }, []);

  const generateShareToken = useCallback(async (id: string): Promise<string | null> => {
    try {
      const token = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      
      const { error } = await supabase
        .from("presentations")
        .update({ 
          share_token: token,
          is_public: true 
        })
        .eq("id", id);

      if (error) throw error;

      setPresentations(prev => prev.map(p => 
        p.id === id ? { ...p, share_token: token, is_public: true } : p
      ));
      
      return token;
    } catch (error) {
      console.error("Error generating share token:", error);
      toast.error("Failed to generate share link");
      return null;
    }
  }, []);

  const getPresentationByShareToken = useCallback(async (token: string): Promise<Presentation | null> => {
    try {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", true)
        .single();

      if (error) throw error;

      return {
        ...data,
        items: (data.items as unknown as PresentationItem[]) || [],
      };
    } catch (error) {
      console.error("Error fetching presentation by share token:", error);
      return null;
    }
  }, []);

  const duplicatePresentation = useCallback(async (id: string): Promise<Presentation | null> => {
    const original = presentations.find(p => p.id === id);
    if (!original) return null;

    return createPresentation({
      title: `${original.title} (Copy)`,
      description: original.description || undefined,
      items: original.items,
    });
  }, [presentations, createPresentation]);

  return {
    presentations,
    loading,
    fetchPresentations,
    createPresentation,
    updatePresentation,
    deletePresentation,
    generateShareToken,
    getPresentationByShareToken,
    duplicatePresentation,
  };
};

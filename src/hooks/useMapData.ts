import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useZones = () => {
  return useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .eq("visible", true);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useHotspots = () => {
  return useQuery({
    queryKey: ["hotspots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotspots")
        .select("*")
        .eq("visible", true);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer_info:developers(name, logo_url)
        `)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useLandmarks = () => {
  return useQuery({
    queryKey: ["landmarks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landmarks")
        .select("*")
        .eq("visible", true);
      
      if (error) throw error;
      return data || [];
    },
  });
};

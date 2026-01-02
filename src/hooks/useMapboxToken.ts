import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMapboxToken = () => {
  return useQuery({
    queryKey: ["mapbox-token"],
    queryFn: async () => {
      // Get the current session to include auth header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Authentication required");
      }
      
      const { data, error } = await supabase.functions.invoke("mapbox-token");
      
      if (error) throw error;
      if (!data?.token) throw new Error("No token received");
      
      return data.token as string;
    },
    staleTime: Infinity, // Token doesn't change, cache forever
  });
};

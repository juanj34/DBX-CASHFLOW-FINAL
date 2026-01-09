import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useQuoteViewNotifications = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time inserts on quote_views
    const channel = supabase
      .channel("quote-view-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quote_views",
        },
        async (payload) => {
          const newView = payload.new as {
            quote_id: string;
            city?: string;
            country?: string;
            country_code?: string;
          };

          // Fetch quote details to verify ownership and get info
          const { data: quote } = await supabase
            .from("cashflow_quotes")
            .select("client_name, project_name, broker_id")
            .eq("id", newView.quote_id)
            .single();

          // Only show notification if this is the broker's quote
          if (quote && quote.broker_id === user.id) {
            const clientName = quote.client_name || "Someone";
            const projectName = quote.project_name || "your quote";
            const location = newView.city && newView.country
              ? `from ${newView.city}, ${newView.country}`
              : newView.country
              ? `from ${newView.country}`
              : "";

            const countryFlag = newView.country_code ? getCountryFlag(newView.country_code) : "👀";

            toast.info(`${countryFlag} ${clientName} is viewing ${projectName}`, {
              description: location || "Just now",
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);
};

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "👀";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

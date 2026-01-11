import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const usePresentationViewNotifications = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time inserts on presentation_views
    const channel = supabase
      .channel("presentation-view-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "presentation_views",
        },
        async (payload) => {
          const newView = payload.new as {
            presentation_id: string;
            city?: string;
            country?: string;
            country_code?: string;
          };

          // Fetch presentation details to verify ownership and get info
          const { data: presentation } = await supabase
            .from("presentations")
            .select("title, broker_id")
            .eq("id", newView.presentation_id)
            .single();

          // Only show notification if this is the broker's presentation
          if (presentation && presentation.broker_id === user.id) {
            const presentationTitle = presentation.title || "your presentation";
            const location = newView.city && newView.country
              ? `from ${newView.city}, ${newView.country}`
              : newView.country
              ? `from ${newView.country}`
              : "";

            const countryFlag = newView.country_code ? getCountryFlag(newView.country_code) : "🎬";

            toast.info(`${countryFlag} Someone is viewing "${presentationTitle}"`, {
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
  if (!countryCode || countryCode.length !== 2) return "🎬";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

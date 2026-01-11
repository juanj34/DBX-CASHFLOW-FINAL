import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ViewByDay {
  date: string;
  views: number;
  uniqueSessions: number;
}

interface LocationData {
  country: string;
  countryCode: string;
  count: number;
  cities: { city: string; count: number }[];
}

export interface PresentationAnalytics {
  totalViews: number;
  uniqueViewers: number;
  avgEngagementTime: number;
  totalEngagementTime: number;
  viewsByDay: ViewByDay[];
  locationBreakdown: LocationData[];
  recentViews: {
    id: string;
    startedAt: string;
    duration: number | null;
    country: string | null;
    city: string | null;
  }[];
}

export const usePresentationAnalytics = (presentationId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [rawViews, setRawViews] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!presentationId) {
        setLoading(false);
        return;
      }

      try {
        const { data: views, error } = await supabase
          .from("presentation_views")
          .select("*")
          .eq("presentation_id", presentationId)
          .order("started_at", { ascending: false });

        if (error) {
          console.error("Error fetching presentation views:", error);
        }

        setRawViews(views || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presentationId]);

  const analytics = useMemo<PresentationAnalytics | null>(() => {
    if (loading || !presentationId) return null;

    // Calculate total and unique views
    const totalViews = rawViews.length;
    const uniqueSessions = new Set(rawViews.map((v) => v.session_id)).size;

    // Calculate engagement time
    const viewsWithDuration = rawViews.filter((v) => v.duration_seconds != null);
    const totalEngagementTime = viewsWithDuration.reduce(
      (sum, v) => sum + (v.duration_seconds || 0),
      0
    );
    const avgEngagementTime =
      viewsWithDuration.length > 0 ? totalEngagementTime / viewsWithDuration.length : 0;

    // Views by day (last 30 days)
    const viewsByDayMap = new Map<string, { views: number; sessions: Set<string> }>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    rawViews.forEach((v) => {
      const date = new Date(v.started_at);
      if (date >= thirtyDaysAgo) {
        const dateStr = date.toISOString().split("T")[0];
        if (!viewsByDayMap.has(dateStr)) {
          viewsByDayMap.set(dateStr, { views: 0, sessions: new Set() });
        }
        const entry = viewsByDayMap.get(dateStr)!;
        entry.views++;
        entry.sessions.add(v.session_id);
      }
    });

    const viewsByDay: ViewByDay[] = Array.from(viewsByDayMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueSessions: data.sessions.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Location breakdown
    const locationMap = new Map<string, { code: string; count: number; cities: Map<string, number> }>();
    rawViews.forEach((v) => {
      if (v.country) {
        if (!locationMap.has(v.country)) {
          locationMap.set(v.country, { code: v.country_code || "", count: 0, cities: new Map() });
        }
        const entry = locationMap.get(v.country)!;
        entry.count++;
        if (v.city) {
          entry.cities.set(v.city, (entry.cities.get(v.city) || 0) + 1);
        }
      }
    });
    
    const locationBreakdown: LocationData[] = Array.from(locationMap.entries())
      .map(([country, data]) => ({
        country,
        countryCode: data.code,
        count: data.count,
        cities: Array.from(data.cities.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count);

    // Recent views
    const recentViews = rawViews.slice(0, 10).map((v) => ({
      id: v.id,
      startedAt: v.started_at,
      duration: v.duration_seconds,
      country: v.country,
      city: v.city,
    }));

    return {
      totalViews,
      uniqueViewers: uniqueSessions,
      avgEngagementTime,
      totalEngagementTime,
      viewsByDay,
      locationBreakdown,
      recentViews,
    };
  }, [rawViews, loading, presentationId]);

  const refetch = async () => {
    if (!presentationId) return;
    setLoading(true);
    const { data: views } = await supabase
      .from("presentation_views")
      .select("*")
      .eq("presentation_id", presentationId)
      .order("started_at", { ascending: false });
    setRawViews(views || []);
    setLoading(false);
  };

  return { analytics, loading, refetch };
};

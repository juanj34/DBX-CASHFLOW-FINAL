import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ViewByDay {
  date: string;
  views: number;
  uniqueSessions: number;
}

interface ViewByHour {
  hour: number;
  views: number;
}

interface ViewByDayOfWeek {
  day: number; // 0 = Sunday
  dayName: string;
  views: number;
}

interface LocationData {
  country: string;
  countryCode: string;
  count: number;
  cities: { city: string; count: number }[];
}

interface ConversionFunnel {
  total: number;
  viewed: number;
  presented: number;
  negotiating: number;
  sold: number;
}

interface TopQuote {
  id: string;
  clientName: string;
  projectName: string;
  views: number;
  avgDuration: number;
  lastViewed: string | null;
}

export interface QuoteAnalytics {
  totalViews: number;
  uniqueViewers: number;
  avgEngagementTime: number;
  totalEngagementTime: number;
  viewsByDay: ViewByDay[];
  viewsByHour: ViewByHour[];
  viewsByDayOfWeek: ViewByDayOfWeek[];
  locationBreakdown: LocationData[];
  conversionFunnel: ConversionFunnel;
  topPerformingQuotes: TopQuote[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const useQuoteAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rawViews, setRawViews] = useState<any[]>([]);
  const [rawQuotes, setRawQuotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all quotes for this broker
        const { data: quotes } = await supabase
          .from("cashflow_quotes")
          .select("id, client_name, project_name, status, view_count, first_viewed_at, last_viewed_at")
          .eq("broker_id", user.id);

        if (!quotes || quotes.length === 0) {
          setRawQuotes([]);
          setRawViews([]);
          setLoading(false);
          return;
        }

        setRawQuotes(quotes);

        // Fetch all views for these quotes
        const quoteIds = quotes.map((q) => q.id);
        const { data: views } = await supabase
          .from("quote_views")
          .select("*")
          .in("quote_id", quoteIds)
          .order("started_at", { ascending: false });

        setRawViews(views || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const analytics = useMemo<QuoteAnalytics | null>(() => {
    if (loading) return null;

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

    // Views by hour
    const viewsByHourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) viewsByHourMap.set(i, 0);
    rawViews.forEach((v) => {
      const hour = new Date(v.started_at).getHours();
      viewsByHourMap.set(hour, (viewsByHourMap.get(hour) || 0) + 1);
    });
    const viewsByHour: ViewByHour[] = Array.from(viewsByHourMap.entries())
      .map(([hour, views]) => ({ hour, views }))
      .sort((a, b) => a.hour - b.hour);

    // Views by day of week
    const viewsByDayOfWeekMap = new Map<number, number>();
    for (let i = 0; i < 7; i++) viewsByDayOfWeekMap.set(i, 0);
    rawViews.forEach((v) => {
      const day = new Date(v.started_at).getDay();
      viewsByDayOfWeekMap.set(day, (viewsByDayOfWeekMap.get(day) || 0) + 1);
    });
    const viewsByDayOfWeek: ViewByDayOfWeek[] = Array.from(viewsByDayOfWeekMap.entries())
      .map(([day, views]) => ({ day, dayName: DAY_NAMES[day], views }))
      .sort((a, b) => a.day - b.day);

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

    // Conversion funnel
    const conversionFunnel: ConversionFunnel = {
      total: rawQuotes.length,
      viewed: rawQuotes.filter((q) => q.view_count > 0).length,
      presented: rawQuotes.filter((q) => q.status === "presented" || q.status === "negotiating" || q.status === "sold").length,
      negotiating: rawQuotes.filter((q) => q.status === "negotiating" || q.status === "sold").length,
      sold: rawQuotes.filter((q) => q.status === "sold").length,
    };

    // Top performing quotes
    const quoteViewsMap = new Map<string, { views: number; durations: number[]; lastViewed: string | null }>();
    rawViews.forEach((v) => {
      if (!quoteViewsMap.has(v.quote_id)) {
        quoteViewsMap.set(v.quote_id, { views: 0, durations: [], lastViewed: null });
      }
      const entry = quoteViewsMap.get(v.quote_id)!;
      entry.views++;
      if (v.duration_seconds) entry.durations.push(v.duration_seconds);
      if (!entry.lastViewed || v.started_at > entry.lastViewed) {
        entry.lastViewed = v.started_at;
      }
    });

    const topPerformingQuotes: TopQuote[] = rawQuotes
      .map((q) => {
        const viewData = quoteViewsMap.get(q.id) || { views: 0, durations: [], lastViewed: null };
        return {
          id: q.id,
          clientName: q.client_name || "Unknown",
          projectName: q.project_name || "No Project",
          views: viewData.views,
          avgDuration: viewData.durations.length > 0
            ? viewData.durations.reduce((a, b) => a + b, 0) / viewData.durations.length
            : 0,
          lastViewed: viewData.lastViewed,
        };
      })
      .filter((q) => q.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalViews,
      uniqueViewers: uniqueSessions,
      avgEngagementTime,
      totalEngagementTime,
      viewsByDay,
      viewsByHour,
      viewsByDayOfWeek,
      locationBreakdown,
      conversionFunnel,
      topPerformingQuotes,
    };
  }, [rawViews, rawQuotes, loading]);

  return { analytics, loading };
};

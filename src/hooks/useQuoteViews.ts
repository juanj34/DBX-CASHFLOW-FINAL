import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuoteView {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  timezone: string | null;
}

export interface QuoteViewAnalytics {
  totalViews: number;
  uniqueSessions: number;
  averageDuration: number | null; // in seconds
  totalTimeSpent: number; // in seconds
  lastViewedAt: string | null;
  lastViewLocation: string | null;
  lastViewCountryCode: string | null;
  views: QuoteView[];
}

export const useQuoteViews = (quoteId: string | undefined) => {
  const [analytics, setAnalytics] = useState<QuoteViewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteId) {
      setLoading(false);
      return;
    }

    const fetchViews = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('quote_views')
        .select('*')
        .eq('quote_id', quoteId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching quote views:', error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setAnalytics({
          totalViews: 0,
          uniqueSessions: 0,
          averageDuration: null,
          totalTimeSpent: 0,
          lastViewedAt: null,
          lastViewLocation: null,
          lastViewCountryCode: null,
          views: [],
        });
        setLoading(false);
        return;
      }

      // Calculate analytics
      const viewsWithDuration = data.filter(v => v.duration_seconds !== null && v.duration_seconds > 0);
      const totalTimeSpent = viewsWithDuration.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
      const averageDuration = viewsWithDuration.length > 0 
        ? totalTimeSpent / viewsWithDuration.length 
        : null;

      const lastView = data[0];
      let lastViewLocation: string | null = null;
      if (lastView) {
        const parts = [];
        if (lastView.city) parts.push(lastView.city);
        if (lastView.country) parts.push(lastView.country);
        lastViewLocation = parts.length > 0 ? parts.join(', ') : null;
      }

      setAnalytics({
        totalViews: data.length,
        uniqueSessions: new Set(data.map(v => v.session_id)).size,
        averageDuration,
        totalTimeSpent,
        lastViewedAt: lastView?.started_at || null,
        lastViewLocation,
        lastViewCountryCode: lastView?.country_code || null,
        views: data as QuoteView[],
      });
      
      setLoading(false);
    };

    fetchViews();
  }, [quoteId]);

  return { analytics, loading };
};

// Helper function to format duration
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === 0) return '—';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

// Helper to get country flag emoji
export const getCountryFlag = (countryCode: string | null): string => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
import { BarChart3, Eye, Clock, Users, TrendingUp } from "lucide-react";
import { useQuoteAnalytics } from "@/hooks/useQuoteAnalytics";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDuration } from "@/hooks/useQuoteViews";
import { ViewsOverTimeChart } from "@/components/analytics/ViewsOverTimeChart";
import { EngagementHeatmap } from "@/components/analytics/EngagementHeatmap";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { LocationBreakdown } from "@/components/analytics/LocationBreakdown";
import { TopQuotesTable } from "@/components/analytics/TopQuotesTable";
import { TopNavbar } from "@/components/layout/TopNavbar";

const QuotesAnalytics = () => {
  useDocumentTitle("Analytics");
  const { analytics, loading } = useQuoteAnalytics();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <TopNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
            <h2 className="text-xl text-theme-text mb-2">No analytics data</h2>
            <p className="text-theme-text-muted">Share some quotes to start seeing analytics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <TopNavbar />

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-theme-text-muted uppercase">Total Views</span>
            </div>
            <p className="text-3xl font-bold text-theme-text">{analytics.totalViews}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5 hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-theme-text-muted uppercase">Unique Viewers</span>
            </div>
            <p className="text-3xl font-bold text-theme-text">{analytics.uniqueViewers}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5 hover:border-theme-accent/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-theme-accent" />
              <span className="text-xs text-theme-text-muted uppercase">Avg. Time</span>
            </div>
            <p className="text-3xl font-bold text-theme-text">{formatDuration(analytics.avgEngagementTime)}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5 hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-theme-text-muted uppercase">Conversion</span>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {analytics.conversionFunnel.total > 0
                ? Math.round((analytics.conversionFunnel.sold / analytics.conversionFunnel.total) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ViewsOverTimeChart data={analytics.viewsByDay} />
          <ConversionFunnel data={analytics.conversionFunnel} />
        </div>

        {/* Heatmap and Location */}
        <div className="grid lg:grid-cols-2 gap-6">
          <EngagementHeatmap 
            viewsByHour={analytics.viewsByHour} 
            viewsByDayOfWeek={analytics.viewsByDayOfWeek} 
          />
          <LocationBreakdown data={analytics.locationBreakdown} />
        </div>

        {/* Top Quotes */}
        <TopQuotesTable quotes={analytics.topPerformingQuotes} />
      </main>
    </div>
  );
};

export default QuotesAnalytics;

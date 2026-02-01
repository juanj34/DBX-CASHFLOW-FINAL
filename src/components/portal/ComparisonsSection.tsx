import { BarChart3, Layers, Scale, Calendar, ExternalLink, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SavedComparison } from "@/hooks/useSavedComparisons";
import { SecondaryComparison } from "@/hooks/useSecondaryComparisons";
import { Currency } from "@/components/roi/currencyUtils";

interface ComparisonsSectionProps {
  savedComparisons: SavedComparison[];
  secondaryComparisons: SecondaryComparison[];
  currency: Currency;
  language: 'en' | 'es';
}

export const ComparisonsSection = ({
  savedComparisons,
  secondaryComparisons,
  currency,
  language,
}: ComparisonsSectionProps) => {
  const hasAnyComparisons = savedComparisons.length > 0 || secondaryComparisons.length > 0;

  if (!hasAnyComparisons) {
    return (
      <div className="text-center py-12">
        <Scale className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
        <h3 className="text-lg text-theme-text mb-2">No comparisons yet</h3>
        <p className="text-theme-text-muted text-sm">
          Your advisor will share property comparisons and analyses with you here.
        </p>
      </div>
    );
  }

  const handleOpenSavedComparison = (comparison: SavedComparison) => {
    if (comparison.share_token) {
      window.open(`/compare-view/${comparison.share_token}?currency=${currency}&lang=${language}`, '_blank');
    }
  };

  const handleOpenSecondaryComparison = (comparison: SecondaryComparison) => {
    if (comparison.share_token) {
      window.open(`/compare-secondary/${comparison.share_token}?currency=${currency}&lang=${language}`, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Quote Comparisons Section */}
      {savedComparisons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-theme-accent" />
            Property Comparisons
          </h3>
          <div className="space-y-3">
            {savedComparisons.map((comparison) => (
              <Card 
                key={comparison.id} 
                className="bg-theme-card border-theme-border hover:border-theme-accent/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-6 h-6 text-theme-accent" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-theme-text">{comparison.title}</h4>
                          {comparison.description && (
                            <p className="text-sm text-theme-text-muted mt-1 line-clamp-2">
                              {comparison.description}
                            </p>
                          )}
                        </div>
                        
                        {comparison.share_token && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSavedComparison(comparison)}
                            className="bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30 border border-theme-accent/30 shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
                          <Layers className="w-3 h-3 mr-1" />
                          {comparison.quote_ids.length} properties
                        </Badge>
                        {comparison.investment_focus && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                            {comparison.investment_focus}
                          </Badge>
                        )}
                        <span className="text-xs text-theme-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(comparison.updated_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Off-Plan vs Secondary Section */}
      {secondaryComparisons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-orange-400" />
            Off-Plan vs Secondary Analyses
          </h3>
          <div className="space-y-3">
            {secondaryComparisons.map((comparison) => (
              <Card 
                key={comparison.id} 
                className="bg-theme-card border-theme-border hover:border-orange-500/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Scale className="w-6 h-6 text-orange-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-theme-text">{comparison.title}</h4>
                          <p className="text-sm text-theme-text-muted mt-1">
                            {comparison.rental_mode === 'airbnb' ? 'Short-term rental' : 'Long-term rental'} strategy
                          </p>
                        </div>
                        
                        {comparison.share_token && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSecondaryComparison(comparison)}
                            className="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30 shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
                          {comparison.exit_months.length} exit scenarios
                        </Badge>
                        <span className="text-xs text-theme-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(comparison.updated_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

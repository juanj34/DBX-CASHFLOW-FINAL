import { Link } from "react-router-dom";
import { Eye, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/hooks/useQuoteViews";

interface TopQuote {
  id: string;
  clientName: string;
  projectName: string;
  views: number;
  avgDuration: number;
  lastViewed: string | null;
}

interface TopQuotesTableProps {
  quotes: TopQuote[];
}

export const TopQuotesTable = ({ quotes }: TopQuotesTableProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-theme-accent" />
        <h3 className="text-lg font-semibold text-theme-text">Top Performing Quotes</h3>
      </div>

      {quotes.length === 0 ? (
        <div className="py-8 text-center text-theme-text-muted">
          No quotes have been viewed yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-theme-text-muted">Client / Project</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-theme-text-muted">Views</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-theme-text-muted hidden sm:table-cell">Avg. Time</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-theme-text-muted hidden md:table-cell">Last Viewed</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-theme-text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote, idx) => (
                <tr key={quote.id} className="border-b border-theme-border/50 hover:bg-theme-card-alt/30">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-theme-accent/20 text-theme-accent text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-theme-text">{quote.clientName}</p>
                        <p className="text-xs text-theme-text-muted">{quote.projectName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-sm font-medium text-theme-text">{quote.views}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-theme-text-muted" />
                      <span className="text-sm text-theme-text">{formatDuration(quote.avgDuration)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center hidden md:table-cell">
                    <span className="text-sm text-theme-text-muted">{formatDate(quote.lastViewed)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Link to={`/cashflow/${quote.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-theme-text-muted hover:text-theme-accent">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

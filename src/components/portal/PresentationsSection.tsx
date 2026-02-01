import { Presentation, ExternalLink, Calendar, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PresentationData {
  id: string;
  title: string;
  description: string | null;
  share_token: string | null;
  items: any[];
  updated_at: string;
}

interface PresentationsSectionProps {
  presentations: PresentationData[];
}

export const PresentationsSection = ({ presentations }: PresentationsSectionProps) => {
  if (presentations.length === 0) {
    return (
      <div className="text-center py-12">
        <Presentation className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
        <h3 className="text-lg text-theme-text mb-2">No presentations yet</h3>
        <p className="text-theme-text-muted text-sm">
          Your advisor will share market analyses and comparisons with you here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {presentations.map(pres => (
        <Card key={pres.id} className="bg-theme-card border-theme-border hover:border-purple-500/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Presentation className="w-6 h-6 text-purple-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-theme-text">{pres.title}</h3>
                    {pres.description && (
                      <p className="text-sm text-theme-text-muted mt-1 line-clamp-2">
                        {pres.description}
                      </p>
                    )}
                  </div>
                  
                  {pres.share_token && (
                    <Button
                      size="sm"
                      onClick={() => window.open(`/present/${pres.share_token}`, '_blank')}
                      className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    {pres.items?.length || 0} properties
                  </Badge>
                  <span className="text-xs text-theme-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(pres.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { Building, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PortalEmptyStateProps {
  type: 'portfolio' | 'all';
}

export const PortalEmptyState = ({ type }: PortalEmptyStateProps) => {
  if (type === 'portfolio') {
    return (
      <Card className="bg-theme-card/50 border-theme-border border-dashed">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-theme-accent/50" />
          </div>
          <h3 className="text-lg font-medium text-theme-text mb-2">
            Your Portfolio Awaits
          </h3>
          <p className="text-theme-text-muted text-sm max-w-sm mx-auto">
            Once you invest in a property, you'll be able to track its value, 
            appreciation, and rental income right here.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-theme-text-muted">
            <Sparkles className="w-3 h-3" />
            <span>Check out the Opportunities tab to explore investment options</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-theme-card/50 border-theme-border border-dashed">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-theme-accent/10 flex items-center justify-center mx-auto mb-6">
          <Building className="w-10 h-10 text-theme-accent/50" />
        </div>
        <h3 className="text-xl font-medium text-theme-text mb-3">
          Welcome to Your Investment Portal
        </h3>
        <p className="text-theme-text-muted max-w-md mx-auto">
          Your advisor will share investment opportunities, market analyses, 
          and portfolio updates with you here. Check back soon!
        </p>
      </CardContent>
    </Card>
  );
};

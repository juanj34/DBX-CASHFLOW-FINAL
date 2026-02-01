import { Building, MapPin, Calendar, TrendingUp, Home, Landmark, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AcquiredProperty } from "@/hooks/usePortfolio";
import { format } from "date-fns";

interface PropertyCardProps {
  property: AcquiredProperty;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const formatCurrency = (value: number, currency = "AED") => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PropertyCard = ({ property, onEdit, onDelete, showActions = true }: PropertyCardProps) => {
  const currentValue = property.current_value || property.purchase_price;
  const appreciation = currentValue - property.purchase_price;
  const appreciationPercent = (appreciation / property.purchase_price) * 100;
  const isPositive = appreciation >= 0;

  return (
    <Card className="bg-theme-card border-theme-border hover:border-theme-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-theme-text truncate">{property.project_name}</h3>
              <p className="text-xs text-theme-text-muted truncate">
                {property.developer && `${property.developer} • `}
                {property.unit && `Unit ${property.unit}`}
              </p>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-theme-text-muted hover:text-theme-text">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-theme-card border-theme-border">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Property Details */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-theme-text-muted">Purchase Price</p>
            <p className="text-sm font-medium text-theme-text">{formatCurrency(property.purchase_price)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-theme-text-muted">Current Value</p>
            <p className="text-sm font-medium text-theme-text">{formatCurrency(currentValue)}</p>
          </div>
        </div>

        {/* Appreciation */}
        <div className="mt-3 p-2 rounded-lg bg-theme-bg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-xs text-theme-text-muted">Appreciation</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatCurrency(appreciation)}
            </span>
            <span className={`text-xs ml-1 ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              ({isPositive ? '+' : ''}{appreciationPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(property.purchase_date), "MMM yyyy")}
          </Badge>
          
          {property.unit_type && (
            <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
              {property.unit_type}
            </Badge>
          )}
          
          {property.is_rented && (
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs flex items-center gap-1">
              <Home className="w-3 h-3" />
              Rented: {formatCurrency(property.monthly_rent || 0)}/mo
            </Badge>
          )}
          
          {property.has_mortgage && (
            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              Mortgage
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

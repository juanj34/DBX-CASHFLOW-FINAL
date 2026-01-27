import { User, Mail, Phone, MapPin, MoreVertical, ExternalLink, Pencil, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/hooks/useClients";
import { toast } from "sonner";

interface ClientCardProps {
  client: Client;
  quotesCount?: number;
  presentationsCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  onGeneratePortal: () => void;
}

export const ClientCard = ({
  client,
  quotesCount = 0,
  presentationsCount = 0,
  onEdit,
  onDelete,
  onGeneratePortal,
}: ClientCardProps) => {
  const handleCopyPortalLink = () => {
    if (client.portal_token) {
      const url = `${window.location.origin}/portal/${client.portal_token}`;
      navigator.clipboard.writeText(url);
      toast.success("Portal link copied to clipboard");
    }
  };

  const handleOpenPortal = () => {
    if (client.portal_token) {
      window.open(`/portal/${client.portal_token}`, '_blank');
    }
  };

  return (
    <Card className="bg-theme-card border-theme-border hover:border-theme-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-theme-text truncate">{client.name}</h3>
              {client.email && (
                <p className="text-xs text-theme-text-muted truncate">{client.email}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-theme-text-muted hover:text-theme-text">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-theme-card border-theme-border">
              <DropdownMenuItem onClick={onEdit} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {client.portal_token ? (
                <>
                  <DropdownMenuItem onClick={handleCopyPortalLink} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Portal Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenPortal} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Portal
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={onGeneratePortal} className="text-theme-accent hover:bg-theme-bg cursor-pointer">
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Portal Link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-theme-border" />
              <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {client.country && (
            <div className="flex items-center gap-1 text-xs text-theme-text-muted">
              <MapPin className="w-3 h-3" />
              {client.country}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1 text-xs text-theme-text-muted">
              <Phone className="w-3 h-3" />
              {client.phone}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
            {quotesCount} quote{quotesCount !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
            {presentationsCount} presentation{presentationsCount !== 1 ? 's' : ''}
          </Badge>
          {client.portal_enabled && client.portal_token && (
            <Badge className="bg-theme-accent/20 text-theme-accent border-0 text-xs">
              Portal Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

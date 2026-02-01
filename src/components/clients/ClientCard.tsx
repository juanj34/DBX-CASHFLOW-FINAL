import { useState, useEffect } from "react";
import { User, MapPin, Phone, MoreVertical, ExternalLink, Pencil, Trash2, Link2, FileText, Eye, ChevronDown, ChevronUp, Plus, Presentation, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ClientQuote {
  id: string;
  title: string | null;
  project_name: string | null;
  developer: string | null;
  status: string | null;
  updated_at: string;
  share_token: string | null;
}

interface ClientPresentation {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  is_public: boolean;
  share_token: string | null;
}

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
  const navigate = useNavigate();
  const [showQuotes, setShowQuotes] = useState(false);
  const [showPresentations, setShowPresentations] = useState(false);
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [presentations, setPresentations] = useState<ClientPresentation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingPresentations, setLoadingPresentations] = useState(false);

  // Fetch quotes when expanded
  useEffect(() => {
    if (showQuotes && quotes.length === 0) {
      const fetchQuotes = async () => {
        setLoadingQuotes(true);
        const { data } = await supabase
          .from('cashflow_quotes')
          .select('id, title, project_name, developer, status, updated_at, share_token')
          .eq('client_id', client.id)
          .or('is_archived.is.null,is_archived.eq.false')
          .order('updated_at', { ascending: false })
          .limit(5);
        
        if (data) {
          setQuotes(data);
        }
        setLoadingQuotes(false);
      };
      fetchQuotes();
    }
  }, [showQuotes, client.id, quotes.length]);

  // Fetch presentations when expanded
  useEffect(() => {
    if (showPresentations && presentations.length === 0) {
      const fetchPresentations = async () => {
        setLoadingPresentations(true);
        const { data } = await supabase
          .from('presentations')
          .select('id, title, description, updated_at, is_public, share_token')
          .eq('client_id', client.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        
        if (data) {
          setPresentations(data);
        }
        setLoadingPresentations(false);
      };
      fetchPresentations();
    }
  }, [showPresentations, client.id, presentations.length]);

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

  const handleCreateQuote = () => {
    // Store client info in localStorage for the generator to pick up
    localStorage.setItem('preselected_client', JSON.stringify({
      dbClientId: client.id,
      clientName: client.name,
      clientEmail: client.email || '',
      clientCountry: client.country || ''
    }));
    navigate('/cashflow-generator');
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'presented': return 'bg-blue-500/20 text-blue-400';
      case 'negotiating': return 'bg-amber-500/20 text-amber-400';
      case 'sold': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
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
              <DropdownMenuItem 
                onClick={() => navigate(`/clients/${client.id}/portfolio`)} 
                className="text-theme-accent hover:bg-theme-bg cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                View Portfolio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateQuote} className="text-cyan-400 hover:bg-theme-bg cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Quote
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-theme-border" />
              <DropdownMenuItem onClick={onEdit} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {client.portal_token ? (
                <>
                  <DropdownMenuItem onClick={handleOpenPortal} className="text-cyan-400 hover:bg-theme-bg cursor-pointer">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyPortalLink} className="text-theme-text hover:bg-theme-bg cursor-pointer">
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Portal Link
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

        {/* Stats Row with Create Quote Button */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {quotesCount > 0 ? (
            <button
              onClick={() => setShowQuotes(!showQuotes)}
              className="flex items-center gap-1 text-xs bg-theme-bg text-cyan-400 px-2 py-1 rounded hover:bg-theme-bg/80 transition-colors"
            >
              <FileText className="w-3 h-3" />
              {quotesCount} quote{quotesCount !== 1 ? 's' : ''}
              {showQuotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
              0 quotes
            </Badge>
          )}
          
          {presentationsCount > 0 ? (
            <button
              onClick={() => setShowPresentations(!showPresentations)}
              className="flex items-center gap-1 text-xs bg-theme-bg text-pink-400 px-2 py-1 rounded hover:bg-theme-bg/80 transition-colors"
            >
              <Presentation className="w-3 h-3" />
              {presentationsCount} presentation{presentationsCount !== 1 ? 's' : ''}
              {showPresentations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs">
              0 presentations
            </Badge>
          )}
          
          {client.portal_enabled && client.portal_token && (
            <Badge className="bg-theme-accent/20 text-theme-accent border-0 text-xs">
              Portal Active
            </Badge>
          )}
          
          {/* Create Quote Button */}
          <Button
            onClick={handleCreateQuote}
            size="sm"
            className="ml-auto h-6 px-2 text-xs bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30 border-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            Quote
          </Button>
        </div>

        {/* Expandable Quotes List */}
        {showQuotes && (
          <div className="mt-3 pt-3 border-t border-theme-border space-y-2">
            {loadingQuotes ? (
              <p className="text-xs text-theme-text-muted">Loading quotes...</p>
            ) : quotes.length === 0 ? (
              <p className="text-xs text-theme-text-muted">No quotes found</p>
            ) : (
              quotes.map((quote) => (
                <div 
                  key={quote.id} 
                  className="flex items-center justify-between gap-2 p-2 bg-theme-bg rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-theme-text truncate">
                      {quote.title || quote.project_name || 'Untitled Quote'}
                    </p>
                    <p className="text-[10px] text-theme-text-muted">
                      {quote.developer && <span>{quote.developer} • </span>}
                      {formatDistanceToNow(new Date(quote.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(quote.status)}`}>
                      {quote.status || 'draft'}
                    </Badge>
                    <Link to={`/cashflow/${quote.id}`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-theme-text-muted hover:text-theme-accent">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Link to={quote.share_token ? `/view/${quote.share_token}` : `/cashflow/${quote.id}`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-theme-text-muted hover:text-cyan-400">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
            {quotesCount > 5 && (
              <p className="text-[10px] text-theme-text-muted text-center">
                Showing 5 of {quotesCount} quotes
              </p>
            )}
          </div>
        )}

        {/* Expandable Presentations List */}
        {showPresentations && (
          <div className="mt-3 pt-3 border-t border-theme-border space-y-2">
            {loadingPresentations ? (
              <p className="text-xs text-theme-text-muted">Loading presentations...</p>
            ) : presentations.length === 0 ? (
              <p className="text-xs text-theme-text-muted">No presentations found</p>
            ) : (
              presentations.map((presentation) => (
                <div 
                  key={presentation.id} 
                  className="flex items-center justify-between gap-2 p-2 bg-theme-bg rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-theme-text truncate">
                      {presentation.title}
                    </p>
                    <p className="text-[10px] text-theme-text-muted">
                      {formatDistanceToNow(new Date(presentation.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {presentation.is_public && presentation.share_token && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400">
                        Shared
                      </Badge>
                    )}
                    <Link to={`/presentations/${presentation.id}`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-theme-text-muted hover:text-pink-400">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </Link>
                    {presentation.share_token && (
                      <Link to={`/present/${presentation.share_token}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-theme-text-muted hover:text-theme-accent">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
            {presentationsCount > 5 && (
              <p className="text-[10px] text-theme-text-muted text-center">
                Showing 5 of {presentationsCount} presentations
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

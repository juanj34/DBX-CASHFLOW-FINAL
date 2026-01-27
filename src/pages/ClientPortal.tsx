import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  User, FileText, Presentation, Mail, MessageCircle, 
  Building2, ExternalLink, Eye, Calendar, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/AppLogo";
import { useClients, Client } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { format } from "date-fns";

interface QuoteData {
  id: string;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  share_token: string | null;
  inputs: any;
  updated_at: string;
}

interface PresentationData {
  id: string;
  title: string;
  description: string | null;
  share_token: string | null;
  items: any[];
  updated_at: string;
}

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
}

const ClientPortal = () => {
  const { portalToken } = useParams<{ portalToken: string }>();
  const { getClientByPortalToken } = useClients();
  
  const [client, setClient] = useState<Client | null>(null);
  const [advisor, setAdvisor] = useState<AdvisorProfile | null>(null);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(client?.name ? `${client.name} - Portal` : "Client Portal");

  useEffect(() => {
    const fetchData = async () => {
      if (!portalToken) {
        setError("Invalid portal link");
        setLoading(false);
        return;
      }

      try {
        const clientData = await getClientByPortalToken(portalToken);
        
        if (!clientData) {
          setError("Portal not found or access disabled");
          setLoading(false);
          return;
        }

        setClient(clientData);

        // Fetch advisor profile
        const { data: advisorData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code')
          .eq('id', clientData.broker_id)
          .single();

        if (advisorData) {
          setAdvisor(advisorData);
        }

        // Fetch quotes for this client
        const { data: quotesData } = await supabase
          .from('cashflow_quotes')
          .select('id, project_name, developer, unit, unit_type, share_token, inputs, updated_at')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false });

        if (quotesData) {
          setQuotes(quotesData);
        }

        // Fetch presentations for this client
        const { data: presentationsData } = await supabase
          .from('presentations')
          .select('id, title, description, share_token, items, updated_at')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false });

        if (presentationsData) {
          setPresentations(presentationsData as PresentationData[]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setError("Failed to load portal");
        setLoading(false);
      }
    };

    fetchData();
  }, [portalToken, getClientByPortalToken]);

  const handleEmailAdvisor = () => {
    if (advisor?.business_email) {
      window.open(`mailto:${advisor.business_email}`, '_blank');
    }
  };

  const handleWhatsAppAdvisor = () => {
    if (advisor?.whatsapp_number) {
      const number = `${advisor.whatsapp_country_code || '+971'}${advisor.whatsapp_number}`.replace(/\D/g, '');
      window.open(`https://wa.me/${number}`, '_blank');
    }
  };

  const formatPrice = (inputs: any) => {
    const price = inputs?.basePrice || 0;
    if (price > 0) {
      return `AED ${(price / 1000000).toFixed(2)}M`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <User className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
          <h1 className="text-2xl text-theme-text mb-2">Portal Not Available</h1>
          <p className="text-theme-text-muted">{error || 'This portal may have been disabled or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <AppLogo size="md" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-text mb-2">
            Welcome, {client.name}
          </h1>
          <p className="text-theme-text-muted">
            Your personalized investment opportunities
          </p>
        </div>

        {/* Advisor Card */}
        {advisor && (
          <Card className="bg-theme-card border-theme-border mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {advisor.avatar_url ? (
                  <img 
                    src={advisor.avatar_url} 
                    alt={advisor.full_name || 'Advisor'} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-theme-accent/30" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-theme-bg flex items-center justify-center text-xl font-medium text-theme-text border-2 border-theme-accent/30">
                    {advisor.full_name ? advisor.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-theme-text-muted" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-lg font-medium text-theme-text">{advisor.full_name || 'Your Advisor'}</p>
                  <p className="text-sm text-theme-accent">Wealth Advisor</p>
                </div>
                <div className="flex gap-2">
                  {advisor.business_email && (
                    <Button 
                      onClick={handleEmailAdvisor}
                      variant="outline"
                      className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                  {advisor.whatsapp_number && (
                    <Button 
                      onClick={handleWhatsAppAdvisor}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes Section */}
        {quotes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-theme-accent" />
              Investment Opportunities ({quotes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotes.map(quote => (
                <Card key={quote.id} className="bg-theme-card border-theme-border hover:border-theme-accent/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-theme-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-theme-text truncate">
                          {quote.project_name || 'Investment Property'}
                        </h3>
                        {quote.developer && (
                          <p className="text-xs text-theme-text-muted truncate">{quote.developer}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {quote.unit_type && (
                        <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                          <Badge variant="secondary" className="bg-theme-bg">{quote.unit_type}</Badge>
                          {quote.unit && <span>Unit {quote.unit}</span>}
                        </div>
                      )}
                      {formatPrice(quote.inputs) && (
                        <div className="flex items-center gap-1 text-theme-accent font-medium">
                          <DollarSign className="w-4 h-4" />
                          {formatPrice(quote.inputs)}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-theme-text-muted">
                        <Calendar className="w-3 h-3" />
                        Updated {format(new Date(quote.updated_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {quote.share_token && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/snapshot/${quote.share_token}`, '_blank')}
                          className="flex-1 border-theme-border text-theme-text hover:bg-theme-bg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Snapshot
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(`/view/${quote.share_token}`, '_blank')}
                          className="flex-1 bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Cashflow
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Presentations Section */}
        {presentations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center gap-2">
              <Presentation className="w-5 h-5 text-purple-400" />
              Presentations ({presentations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presentations.map(pres => (
                <Card key={pres.id} className="bg-theme-card border-theme-border hover:border-purple-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Presentation className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-theme-text truncate">{pres.title}</h3>
                        {pres.description && (
                          <p className="text-xs text-theme-text-muted line-clamp-2">{pres.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted">
                          {pres.items?.length || 0} items
                        </Badge>
                        <span className="text-xs text-theme-text-muted">
                          {format(new Date(pres.updated_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {pres.share_token && (
                        <Button
                          size="sm"
                          onClick={() => window.open(`/present/${pres.share_token}`, '_blank')}
                          className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {quotes.length === 0 && presentations.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
            <h3 className="text-lg text-theme-text mb-2">No content yet</h3>
            <p className="text-theme-text-muted">
              Your advisor will share investment opportunities with you soon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPortal;

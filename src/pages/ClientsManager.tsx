import { useState, useEffect } from "react";
import { Plus, Search, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, Client, CreateClientInput, UpdateClientInput } from "@/hooks/useClients";
import { ClientCard, ClientForm } from "@/components/clients";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ClientStats {
  [clientId: string]: {
    quotesCount: number;
    presentationsCount: number;
  };
}

const ClientsManager = () => {
  useDocumentTitle("Clients");
  const { clients, loading, createClient, updateClient, deleteClient, generatePortalToken } = useClients();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats>({});

  // Fetch stats for all clients
  useEffect(() => {
    const fetchStats = async () => {
      if (clients.length === 0) return;

      const clientIds = clients.map(c => c.id);
      
      // Fetch quotes count per client
      const { data: quotesData } = await supabase
        .from('cashflow_quotes')
        .select('client_id')
        .in('client_id', clientIds);

      // Fetch presentations count per client
      const { data: presentationsData } = await supabase
        .from('presentations')
        .select('client_id')
        .in('client_id', clientIds);

      const stats: ClientStats = {};
      clientIds.forEach(id => {
        stats[id] = {
          quotesCount: quotesData?.filter(q => q.client_id === id).length || 0,
          presentationsCount: presentationsData?.filter(p => p.client_id === id).length || 0,
        };
      });
      setClientStats(stats);
    };

    fetchStats();
  }, [clients]);

  const filteredClients = clients.filter(client => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.country?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreate = async (data: CreateClientInput) => {
    await createClient(data);
  };

  const handleUpdate = async (data: UpdateClientInput) => {
    if (editingClient) {
      await updateClient(editingClient.id, data);
      setEditingClient(null);
    }
  };

  const handleDelete = async () => {
    if (deletingClient) {
      await deleteClient(deletingClient.id);
      setDeletingClient(null);
    }
  };

  const handleGeneratePortal = async (client: Client) => {
    const token = await generatePortalToken(client.id);
    if (token) {
      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Portal link generated and copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                <Users className="w-6 h-6 text-theme-accent" />
                Clients
              </h1>
              <p className="text-sm text-theme-text-muted mt-1">
                Manage your client database and portal access
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setFormOpen(true)}
            className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-theme-card border-theme-border text-theme-text"
          />
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12 text-theme-text-muted">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
            {search ? (
              <>
                <h3 className="text-lg text-theme-text mb-2">No clients found</h3>
                <p className="text-theme-text-muted">Try a different search term</p>
              </>
            ) : (
              <>
                <h3 className="text-lg text-theme-text mb-2">No clients yet</h3>
                <p className="text-theme-text-muted mb-4">Create your first client to get started</p>
                <Button 
                  onClick={() => setFormOpen(true)}
                  className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Client
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                quotesCount={clientStats[client.id]?.quotesCount || 0}
                presentationsCount={clientStats[client.id]?.presentationsCount || 0}
                onEdit={() => setEditingClient(client)}
                onDelete={() => setDeletingClient(client)}
                onGeneratePortal={() => handleGeneratePortal(client)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Form */}
      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Form */}
      {editingClient && (
        <ClientForm
          open={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSubmit={handleUpdate}
          client={editingClient}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingClient} onOpenChange={(o) => !o && setDeletingClient(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Delete Client?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This will permanently delete <strong>{deletingClient?.name}</strong> and remove their association 
              from all quotes and presentations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg border-theme-border text-theme-text hover:bg-theme-card">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsManager;

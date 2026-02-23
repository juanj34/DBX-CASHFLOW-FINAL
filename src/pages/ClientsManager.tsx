import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Users, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TopNavbar } from "@/components/layout/TopNavbar";

interface ClientStats {
  [clientId: string]: {
    quotesCount: number;
    presentationsCount: number;
  };
}

type FilterOption = 'all' | 'with-portal' | 'without-portal' | 'with-quotes' | 'without-quotes';

const ClientsManager = () => {
  useDocumentTitle("Clients");
  const { clients, loading, createClient, updateClient, deleteClient, generatePortalToken } = useClients();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        const matchesSearch = (
          client.name.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.country?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      
      // Category filter
      const stats = clientStats[client.id];
      switch (filter) {
        case 'with-portal':
          return client.portal_enabled && client.portal_token;
        case 'without-portal':
          return !client.portal_token;
        case 'with-quotes':
          return stats && stats.quotesCount > 0;
        case 'without-quotes':
          return !stats || stats.quotesCount === 0;
        default:
          return true;
      }
    });
  }, [clients, search, filter, clientStats]);

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
      setCopiedToken(client.id);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Portal link generated and copied to clipboard");
    }
  };

  const handleCopyPortalLink = async (client: Client) => {
    if (client.portal_token) {
      const url = `${window.location.origin}/portal/${client.portal_token}`;
      await navigator.clipboard.writeText(url);
      setCopiedToken(client.id);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Portal link copied to clipboard");
    }
  };

  const handleOpenPortal = (client: Client) => {
    if (client.portal_token) {
      window.open(`/portal/${client.portal_token}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      <TopNavbar />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-theme-card border-theme-border text-theme-text"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
            <SelectTrigger className="w-[180px] bg-theme-card border-theme-border text-theme-text">
              <Filter className="w-4 h-4 mr-2 text-theme-text-muted" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-theme-card border-theme-border">
              <SelectItem value="all" className="text-theme-text">All Clients</SelectItem>
              <SelectItem value="with-portal" className="text-theme-text">With Portal</SelectItem>
              <SelectItem value="without-portal" className="text-theme-text">Without Portal</SelectItem>
              <SelectItem value="with-quotes" className="text-theme-text">With Quotes</SelectItem>
              <SelectItem value="without-quotes" className="text-theme-text">Without Quotes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card border border-theme-border rounded-lg p-3">
            <p className="text-xs text-theme-text-muted">Total Clients</p>
            <p className="text-xl font-bold text-theme-text">{clients.length}</p>
          </div>
          <div className="bg-theme-card border border-theme-border rounded-lg p-3">
            <p className="text-xs text-theme-text-muted">With Portal</p>
            <p className="text-xl font-bold text-theme-accent">
              {clients.filter(c => c.portal_enabled && c.portal_token).length}
            </p>
          </div>
          <div className="bg-theme-card border border-theme-border rounded-lg p-3">
            <p className="text-xs text-theme-text-muted">Total Quotes</p>
            <p className="text-xl font-bold text-cyan-400">
              {Object.values(clientStats).reduce((sum, s) => sum + s.quotesCount, 0)}
            </p>
          </div>
          <div className="bg-theme-card border border-theme-border rounded-lg p-3">
            <p className="text-xs text-theme-text-muted">Total Presentations</p>
            <p className="text-xl font-bold text-purple-400">
              {Object.values(clientStats).reduce((sum, s) => sum + s.presentationsCount, 0)}
            </p>
          </div>
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
                  className="bg-theme-accent text-white hover:bg-theme-accent/90"
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

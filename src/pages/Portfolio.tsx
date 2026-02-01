import { useState } from "react";
import { Plus, Building, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortfolio, CreatePropertyInput } from "@/hooks/usePortfolio";
import { useClients } from "@/hooks/useClients";
import { PortfolioMetricsCard } from "@/components/portfolio/PortfolioMetricsCard";
import { PropertyCard } from "@/components/portfolio/PropertyCard";
import { PropertyForm } from "@/components/portfolio/PropertyForm";
import { TopNavbar } from "@/components/layout/TopNavbar";
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

const Portfolio = () => {
  useDocumentTitle("Portfolio Manager");
  const { properties, loading, metrics, createProperty, updateProperty, deleteProperty } = usePortfolio();
  const { clients } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = properties.filter(p => 
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.developer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: CreatePropertyInput) => {
    await createProperty(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: CreatePropertyInput) => {
    if (editingProperty) {
      await updateProperty(editingProperty, data);
      setEditingProperty(null);
    }
  };

  const handleDelete = async () => {
    if (deletingProperty) {
      await deleteProperty(deletingProperty);
      setDeletingProperty(null);
    }
  };

  const propertyToEdit = editingProperty ? properties.find(p => p.id === editingProperty) : null;

  return (
    <div className="min-h-screen bg-theme-bg">
      <TopNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-theme-text flex items-center gap-3">
              <Building className="w-7 h-7 text-theme-accent" />
              Portfolio Manager
            </h1>
            <p className="text-theme-text-muted mt-1">
              Track your real estate investments and portfolio performance
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Metrics */}
        <div className="mb-8">
          <PortfolioMetricsCard metrics={metrics} />
        </div>

        {/* Search & Properties */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-theme-card border-theme-border"
              />
            </div>
            <span className="text-sm text-theme-text-muted">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
            </span>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-theme-card border border-theme-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-16 h-16 text-theme-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-theme-text mb-2">
                {searchQuery ? "No properties found" : "No properties yet"}
              </h3>
              <p className="text-theme-text-muted mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first property to start tracking your portfolio"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowForm(true)} className="bg-theme-accent text-theme-bg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onEdit={() => setEditingProperty(property.id)}
                  onDelete={() => setDeletingProperty(property.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Form */}
      <PropertyForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        clients={clients}
        mode="create"
      />

      {/* Edit Form */}
      {propertyToEdit && (
        <PropertyForm
          open={!!editingProperty}
          onClose={() => setEditingProperty(null)}
          onSubmit={handleUpdate}
          initialData={propertyToEdit}
          clients={clients}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProperty} onOpenChange={() => setDeletingProperty(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Remove Property?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This will remove the property from your portfolio. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-theme-border text-theme-text">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Portfolio;

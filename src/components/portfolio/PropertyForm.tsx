import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePropertyInput, AcquiredProperty } from "@/hooks/usePortfolio";
import { Client } from "@/hooks/useClients";

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePropertyInput) => Promise<void>;
  initialData?: Partial<AcquiredProperty>;
  clients?: Client[];
  mode: "create" | "edit";
}

const UNIT_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "penthouse", label: "Penthouse" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "duplex", label: "Duplex" },
];

export const PropertyForm = ({ open, onClose, onSubmit, initialData, clients, mode }: PropertyFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePropertyInput>({
    project_name: initialData?.project_name || "",
    developer: initialData?.developer || "",
    unit: initialData?.unit || "",
    unit_type: initialData?.unit_type || "",
    unit_size_sqf: initialData?.unit_size_sqf || undefined,
    purchase_price: initialData?.purchase_price || 0,
    purchase_date: initialData?.purchase_date || new Date().toISOString().split("T")[0],
    acquisition_fees: initialData?.acquisition_fees || 0,
    current_value: initialData?.current_value || undefined,
    client_id: initialData?.client_id || undefined,
    is_rented: false,
    monthly_rent: undefined,
    has_mortgage: initialData?.has_mortgage || false,
    mortgage_amount: initialData?.mortgage_amount || undefined,
    mortgage_balance: initialData?.mortgage_balance || undefined,
    mortgage_interest_rate: initialData?.mortgage_interest_rate || undefined,
    mortgage_term_years: initialData?.mortgage_term_years || undefined,
    monthly_mortgage_payment: initialData?.monthly_mortgage_payment || undefined,
    notes: initialData?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePropertyInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === "create" ? "Add Property to Portfolio" : "Edit Property"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-theme-accent">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => handleChange("project_name", e.target.value)}
                  required
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer">Developer</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => handleChange("developer", e.target.value)}
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type</Label>
                <Select value={formData.unit_type || ""} onValueChange={(v) => handleChange("unit_type", v)}>
                  <SelectTrigger className="bg-theme-bg border-theme-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border">
                    {UNIT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-theme-text hover:bg-theme-bg">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_size_sqf">Size (sqf)</Label>
                <Input
                  id="unit_size_sqf"
                  type="number"
                  value={formData.unit_size_sqf || ""}
                  onChange={(e) => handleChange("unit_size_sqf", parseFloat(e.target.value) || undefined)}
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              {clients && clients.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select value={formData.client_id || ""} onValueChange={(v) => handleChange("client_id", v || undefined)}>
                    <SelectTrigger className="bg-theme-bg border-theme-border">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-card border-theme-border">
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-theme-text hover:bg-theme-bg">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Acquisition Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-theme-accent">Acquisition Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (AED) *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price || ""}
                  onChange={(e) => handleChange("purchase_price", parseFloat(e.target.value) || 0)}
                  required
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleChange("purchase_date", e.target.value)}
                  required
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisition_fees">Acquisition Fees</Label>
                <Input
                  id="acquisition_fees"
                  type="number"
                  value={formData.acquisition_fees || ""}
                  onChange={(e) => handleChange("acquisition_fees", parseFloat(e.target.value) || 0)}
                  className="bg-theme-bg border-theme-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value</Label>
                <Input
                  id="current_value"
                  type="number"
                  value={formData.current_value || ""}
                  onChange={(e) => handleChange("current_value", parseFloat(e.target.value) || undefined)}
                  placeholder="Leave empty to use purchase price"
                  className="bg-theme-bg border-theme-border"
                />
              </div>
            </div>
          </div>

          {/* Note about rental projections */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400">
              💡 Rental income is automatically projected from the original analysis. No manual entry needed.
            </p>
          </div>

          {/* Mortgage Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-theme-accent">Mortgage</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="has_mortgage" className="text-xs text-theme-text-muted">Has mortgage</Label>
                <Switch
                  id="has_mortgage"
                  checked={formData.has_mortgage}
                  onCheckedChange={(v) => handleChange("has_mortgage", v)}
                />
              </div>
            </div>
            {formData.has_mortgage && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mortgage_amount">Mortgage Amount</Label>
                  <Input
                    id="mortgage_amount"
                    type="number"
                    value={formData.mortgage_amount || ""}
                    onChange={(e) => handleChange("mortgage_amount", parseFloat(e.target.value) || undefined)}
                    className="bg-theme-bg border-theme-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgage_balance">Current Balance</Label>
                  <Input
                    id="mortgage_balance"
                    type="number"
                    value={formData.mortgage_balance || ""}
                    onChange={(e) => handleChange("mortgage_balance", parseFloat(e.target.value) || undefined)}
                    className="bg-theme-bg border-theme-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgage_interest_rate">Interest Rate (%)</Label>
                  <Input
                    id="mortgage_interest_rate"
                    type="number"
                    step="0.1"
                    value={formData.mortgage_interest_rate || ""}
                    onChange={(e) => handleChange("mortgage_interest_rate", parseFloat(e.target.value) || undefined)}
                    className="bg-theme-bg border-theme-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_mortgage_payment">Monthly Payment</Label>
                  <Input
                    id="monthly_mortgage_payment"
                    type="number"
                    value={formData.monthly_mortgage_payment || ""}
                    onChange={(e) => handleChange("monthly_mortgage_payment", parseFloat(e.target.value) || undefined)}
                    className="bg-theme-bg border-theme-border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-theme-bg border-theme-border min-h-[80px]"
              placeholder="Any additional notes about this property..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-theme-border">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
              {loading ? "Saving..." : mode === "create" ? "Add Property" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

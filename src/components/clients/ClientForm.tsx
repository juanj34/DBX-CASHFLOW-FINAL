import { useState } from "react";
import { User, Mail, Phone, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/ui/country-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Client, CreateClientInput, UpdateClientInput } from "@/hooks/useClients";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientInput | UpdateClientInput) => Promise<void>;
  client?: Client;
  mode: 'create' | 'edit';
}

export const ClientForm = ({
  open,
  onClose,
  onSubmit,
  client,
  mode,
}: ClientFormProps) => {
  const [name, setName] = useState(client?.name || "");
  const [email, setEmail] = useState(client?.email || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [country, setCountry] = useState(client?.country || "");
  const [notes, setNotes] = useState(client?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        country: country || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-theme-accent" />
            {mode === 'create' ? 'New Client' : 'Edit Client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-xs text-theme-text-muted">
              Name *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client name"
                className="pl-10 bg-theme-bg border-theme-border text-theme-text"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email" className="text-xs text-theme-text-muted">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                className="pl-10 bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone" className="text-xs text-theme-text-muted">
              Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <Input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                className="pl-10 bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-theme-text-muted">
              Country
            </Label>
            <CountrySelect
              value={country}
              onValueChange={setCountry}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes" className="text-xs text-theme-text-muted">
              Notes
            </Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this client..."
              className="bg-theme-bg border-theme-border text-theme-text resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-theme-text-muted hover:text-theme-text"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-theme-accent text-white hover:bg-theme-accent/90"
            >
              {isSubmitting ? "Saving..." : mode === 'create' ? 'Create Client' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

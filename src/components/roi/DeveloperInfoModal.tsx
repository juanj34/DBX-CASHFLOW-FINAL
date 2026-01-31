// Simplified modal - returns null since we removed developer metrics
// This component can be re-enabled later with database integration

interface DeveloperInfoModalProps {
  developerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeveloperInfoModal = ({ developerId, open, onOpenChange }: DeveloperInfoModalProps) => {
  // Disabled - no database integration for developer metrics
  return null;
};

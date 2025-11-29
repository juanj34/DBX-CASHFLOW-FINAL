import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MapHeaderProps {
  userRole: string | null;
  onClose: () => void;
}

export const MapHeader = ({ userRole, onClose }: MapHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="glass-panel rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Menu</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {userRole === "admin" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2 justify-start"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          className="gap-2 justify-start"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

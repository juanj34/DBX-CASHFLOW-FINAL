import { Button } from "@/components/ui/button";
import { MapPin, Layers, User, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MapHeaderProps {
  userRole: string | null;
}

export const MapHeader = ({ userRole }: MapHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="glass-panel border-b border-border/50 px-6 py-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Dubai Real Estate</h1>
          <p className="text-xs text-muted-foreground">Property Map Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {userRole === "admin" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        )}
        
        <Button variant="outline" size="sm" className="gap-2">
          <Layers className="w-4 h-4" />
          Layers
        </Button>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer } from "@/components/map/MapContainer";
import { MapHeader } from "@/components/map/MapHeader";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Map = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(roleData?.role || "broker");
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.clientY < 60) {
      setHeaderVisible(true);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Map fills entire screen */}
      <MapContainer />

      {/* Compact header overlay on right side */}
      <div 
        className={`absolute top-4 right-4 z-20 transition-transform duration-300 ${
          headerVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <MapHeader userRole={userRole} onClose={() => setHeaderVisible(false)} />
      </div>

      {/* Small toggle button when header is hidden */}
      {!headerVisible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 glass-panel"
          onClick={() => setHeaderVisible(true)}
          title="Show menu"
        >
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </Button>
      )}
    </div>
  );
};

export default Map;

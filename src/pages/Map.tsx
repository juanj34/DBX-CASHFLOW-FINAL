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
    <div 
      className="h-screen w-screen flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Header with auto-hide */}
      <div 
        className={`transition-transform duration-300 z-10 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        onMouseLeave={() => setHeaderVisible(false)}
      >
        <MapHeader userRole={userRole} />
      </div>

      {/* Small toggle button when header is hidden */}
      {!headerVisible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-20 glass-panel"
          onClick={() => setHeaderVisible(true)}
          title="Show header"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}

      <div className="flex-1 relative">
        <MapContainer />
      </div>
    </div>
  );
};

export default Map;

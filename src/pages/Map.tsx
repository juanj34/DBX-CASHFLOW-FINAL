import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer } from "@/components/map/MapContainer";
import { Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { TopNavbar } from "@/components/layout/TopNavbar";

const Map = () => {
  useDocumentTitle("Investment Map");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

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

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden">
      <TopNavbar showNewQuote={false} />
      <div className="flex-1 relative overflow-hidden">
        <MapContainer userRole={userRole} />
      </div>
    </div>
  );
};

export default Map;

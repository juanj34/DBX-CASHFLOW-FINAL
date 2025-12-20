import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Rocket, TrendingUp, FileText, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface SolutionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const solutions: SolutionCard[] = [
  {
    id: "investor-type",
    title: "Investor Type",
    description: "Compare OI, SI, HO investment profiles and analyze returns",
    icon: TrendingUp,
    route: "/roi-calculator",
    color: "#CCFF00",
  },
  {
    id: "cashflow",
    title: "Cashflow Statements",
    description: "Exit scenarios, payment breakdowns & client quotes",
    icon: Rocket,
    route: "/cashflow-generator",
    color: "#00EAFF",
  },
  {
    id: "map",
    title: "Investment Map",
    description: "Dubai zones, projects, hotspots & live presentations",
    icon: Map,
    route: "/map",
    color: "#FF00FF",
  },
];

const Home = () => {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadRecentQuotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadRecentQuotes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("cashflow_quotes")
      .select("id, client_name, project_name, created_at")
      .eq("broker_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (data) setRecentQuotes(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dubai Investment Hub</h1>
              <p className="text-sm text-gray-400">Advisory Platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/my-quotes">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] gap-2">
                <FileText className="w-4 h-4" />
                My Statements
              </Button>
            </Link>
            <Link to="/account-settings">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-gray-400 hover:text-red-400 hover:bg-[#1a1f2e]"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h2>
          <p className="text-gray-400">Your investment advisory dashboard</p>
        </div>

        {/* Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link 
                key={solution.id} 
                to={solution.route}
                className="group"
              >
                <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 h-full transition-all duration-300 hover:border-[#3a4152] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${solution.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: solution.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{solution.title}</h3>
                  <p className="text-sm text-gray-400">{solution.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Cashflow Statements */}
        {recentQuotes.length > 0 && (
          <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Cashflow Statements</h3>
              <Link to="/my-quotes">
                <Button variant="link" className="text-[#CCFF00] hover:text-[#CCFF00]/80 p-0">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentQuotes.map((quote) => (
                <Link 
                  key={quote.id} 
                  to={`/cashflow/${quote.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2a3142] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {quote.client_name || 'Unnamed Client'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quote.project_name || 'No project'} • {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-gray-400">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

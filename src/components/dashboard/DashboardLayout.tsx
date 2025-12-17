import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Map, MapPin, Building2, Sparkles, Users, Camera, Home, ArrowLeft } from "lucide-react";
import ZonesManager from "./ZonesManager";
import HotspotsManager from "./HotspotsManager";
import ProjectsManager from "./ProjectsManager";
import DevelopersManager from "./DevelopersManager";
import LandmarksManager from "./LandmarksManager";
import AIChatPanel from "./AIChatPanel";

type ActiveTab = "zones" | "hotspots" | "projects" | "developers" | "landmarks";

const DashboardLayout = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("zones");
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2a3142] bg-[#1a1f2e]">
        <div className="p-6 border-b border-[#2a3142]">
          <h1 className="text-xl font-semibold text-white">Map Config</h1>
          <p className="text-sm text-gray-400">Manage map data</p>
        </div>

        {/* Navigation to Home/Map */}
        <div className="p-4 border-b border-[#2a3142] space-y-2">
          <Link to="/home">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2a3142]"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/map">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2a3142]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Button>
          </Link>
        </div>
        
        <nav className="p-4 space-y-2">
          <Button
            variant={activeTab === "zones" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === "zones" 
                ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
                : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
            }`}
            onClick={() => setActiveTab("zones")}
          >
            <Map className="mr-2 h-4 w-4" />
            Zones
          </Button>
          
          <Button
            variant={activeTab === "hotspots" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === "hotspots" 
                ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
                : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
            }`}
            onClick={() => setActiveTab("hotspots")}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Hotspots
          </Button>
          
          <Button
            variant={activeTab === "projects" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === "projects" 
                ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
                : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
            }`}
            onClick={() => setActiveTab("projects")}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Projects
          </Button>

          <Button
            variant={activeTab === "developers" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === "developers" 
                ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
                : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
            }`}
            onClick={() => setActiveTab("developers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Developers
          </Button>

          <Button
            variant={activeTab === "landmarks" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === "landmarks" 
                ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
                : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
            }`}
            onClick={() => setActiveTab("landmarks")}
          >
            <Camera className="mr-2 h-4 w-4" />
            Landmarks
          </Button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-[#2a3142]">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-400/10" 
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 relative bg-[#0f172a]">
        {activeTab === "zones" && <ZonesManager />}
        {activeTab === "hotspots" && <HotspotsManager />}
        {activeTab === "projects" && <ProjectsManager />}
        {activeTab === "developers" && <DevelopersManager />}
        {activeTab === "landmarks" && <LandmarksManager />}

        {/* Floating AI Button */}
        <Button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>

        {/* AI Chat Panel */}
        <AIChatPanel open={showAIChat} onOpenChange={setShowAIChat} />
      </main>
    </div>
  );
};

export default DashboardLayout;

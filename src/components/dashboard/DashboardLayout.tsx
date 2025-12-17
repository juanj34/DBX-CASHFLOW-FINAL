import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Map, MapPin, Building2, Sparkles, Users, Camera } from "lucide-react";
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
        
        <nav className="p-4 space-y-2">
          <Button
            variant={activeTab === "zones" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("zones")}
          >
            <Map className="mr-2 h-4 w-4" />
            Zones
          </Button>
          
          <Button
            variant={activeTab === "hotspots" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("hotspots")}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Hotspots
          </Button>
          
          <Button
            variant={activeTab === "projects" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("projects")}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Projects
          </Button>

          <Button
            variant={activeTab === "developers" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("developers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Developers
          </Button>

          <Button
            variant={activeTab === "landmarks" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("landmarks")}
          >
            <Camera className="mr-2 h-4 w-4" />
            Landmarks
          </Button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        {activeTab === "zones" && <ZonesManager />}
        {activeTab === "hotspots" && <HotspotsManager />}
        {activeTab === "projects" && <ProjectsManager />}
        {activeTab === "developers" && <DevelopersManager />}
        {activeTab === "landmarks" && <LandmarksManager />}

        {/* Floating AI Button */}
        <Button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
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

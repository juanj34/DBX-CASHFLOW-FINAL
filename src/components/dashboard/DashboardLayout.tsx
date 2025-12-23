import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Layers, Target, Building2, Sparkles, Users, Landmark, Home, ArrowLeft, TrendingUp, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ZonesManager from "./ZonesManager";
import HotspotsManager from "./HotspotsManager";
import ProjectsManager from "./ProjectsManager";
import DevelopersManager from "./DevelopersManager";
import LandmarksManager from "./LandmarksManager";
import PresetsManager from "./PresetsManager";
import AIChatPanel from "./AIChatPanel";

type ActiveTab = "zones" | "presets" | "hotspots" | "projects" | "developers" | "landmarks";

const DashboardLayout = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("zones");
  const [showAIChat, setShowAIChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavButton = ({ tab, icon: Icon, label }: { tab: ActiveTab; icon: React.ElementType; label: string }) => (
    <Button
      variant={activeTab === tab ? "secondary" : "ghost"}
      className={`w-full justify-start ${
        activeTab === tab 
          ? "bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30" 
          : "text-gray-300 hover:text-white hover:bg-[#2a3142]"
      }`}
      onClick={() => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
      }}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );

  const SidebarContent = () => (
    <>
      {/* Navigation to Home/Map */}
      <div className="p-4 border-b border-[#2a3142] space-y-2">
        <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2a3142]"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link to="/map" onClick={() => setMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2a3142]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </Link>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <NavButton tab="zones" icon={Layers} label="Zones" />
        <NavButton tab="presets" icon={TrendingUp} label="Appreciation Presets" />
        <NavButton tab="hotspots" icon={Target} label="Hotspots" />
        <NavButton tab="projects" icon={Building2} label="Projects" />
        <NavButton tab="developers" icon={Users} label="Developers" />
        <NavButton tab="landmarks" icon={Landmark} label="Landmarks" />
      </nav>

      <div className="p-4 border-t border-[#2a3142]">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-400/10" 
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#2a3142] bg-[#1a1f2e]">
        <div className="p-6 border-b border-[#2a3142]">
          <h1 className="text-xl font-semibold text-white">Configuration Center</h1>
          <p className="text-sm text-gray-400">Manage data & presets</p>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1f2e] border-b border-[#2a3142]">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Configuration</h1>
            <p className="text-xs text-gray-400">Manage data & presets</p>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#2a3142]">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-[#1a1f2e] border-[#2a3142] p-0">
              <SheetHeader className="p-6 border-b border-[#2a3142]">
                <SheetTitle className="text-white text-left">Configuration Center</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-80px)]">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 relative bg-[#0f172a] md:ml-0 mt-[72px] md:mt-0">
        {activeTab === "zones" && <ZonesManager />}
        {activeTab === "presets" && <PresetsManager />}
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

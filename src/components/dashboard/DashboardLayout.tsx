import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Layers, Target, Building2, Sparkles, Users, Landmark, Home, TrendingUp, Menu, Scale, BarChart3, FileText, Map, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppLogo } from "@/components/AppLogo";
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
          ? "bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30" 
          : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
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
      {/* Quick Access - Tools Navigation */}
      <Collapsible defaultOpen className="border-b border-theme-border">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-theme-text-muted hover:text-theme-text transition-colors group">
          <span className="text-xs font-semibold uppercase tracking-wider">Quick Access</span>
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-1">
          <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link to="/my-quotes" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
              <FileText className="mr-2 h-4 w-4" />
              All Opportunities
            </Button>
          </Link>
          <Link to="/compare" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
              <Scale className="mr-2 h-4 w-4" />
              Compare
            </Button>
          </Link>
          <Link to="/quotes-analytics" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link to="/map" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
              <Map className="mr-2 h-4 w-4" />
              Map
            </Button>
          </Link>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Data Management - Collapsible */}
      <Collapsible defaultOpen className="flex-1">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-theme-text-muted hover:text-theme-text transition-colors group">
          <span className="text-xs font-semibold uppercase tracking-wider">Data Management</span>
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-2">
          <NavButton tab="zones" icon={Layers} label="Zones" />
          <NavButton tab="presets" icon={TrendingUp} label="Appreciation Presets" />
          <NavButton tab="hotspots" icon={Target} label="Hotspots" />
          <NavButton tab="projects" icon={Building2} label="Projects" />
          <NavButton tab="developers" icon={Users} label="Developers" />
          <NavButton tab="landmarks" icon={Landmark} label="Landmarks" />
        </CollapsibleContent>
      </Collapsible>

      <div className="p-4 border-t border-theme-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-theme-text-muted hover:text-destructive hover:bg-destructive/10" 
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-theme-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-theme-border bg-theme-card">
        <div className="p-6 border-b border-theme-border">
          <AppLogo size="md" linkTo="/home" showGlow={false} />
          <p className="text-sm text-theme-text-muted mt-2">Configuration Center</p>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-theme-card border-b border-theme-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" linkTo="/home" showGlow={false} collapsed />
            <div>
              <h1 className="text-lg font-semibold text-theme-text">Configuration</h1>
              <p className="text-xs text-theme-text-muted">Manage data & presets</p>
            </div>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-theme-card border-theme-border p-0">
              <SheetHeader className="p-6 border-b border-theme-border">
                <SheetTitle className="text-theme-text text-left">Configuration Center</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-80px)]">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 relative bg-theme-bg md:ml-0 mt-[72px] md:mt-0">
        {activeTab === "zones" && <ZonesManager />}
        {activeTab === "presets" && <PresetsManager />}
        {activeTab === "hotspots" && <HotspotsManager />}
        {activeTab === "projects" && <ProjectsManager />}
        {activeTab === "developers" && <DevelopersManager />}
        {activeTab === "landmarks" && <LandmarksManager />}

        {/* Floating AI Button */}
        <Button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
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

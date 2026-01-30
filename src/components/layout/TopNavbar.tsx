import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, Scale, Presentation, BarChart3, Map, Users, 
  Sparkles, TrendingUp, Plus, Settings, LogOut, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Generator', href: '/cashflow-generator', icon: Sparkles },
  { label: 'All Quotes', href: '/my-quotes', icon: FileText },
  { label: 'Compare', href: '/compare', icon: Scale },
  { label: 'Off-Plan vs Resale', href: '/offplan-vs-secondary', icon: TrendingUp },
  { label: 'Presentations', href: '/presentations', icon: Presentation },
  { label: 'Analytics', href: '/quotes-analytics', icon: BarChart3 },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Clients', href: '/clients', icon: Users },
];

interface TopNavbarProps {
  showNewQuote?: boolean;
}

export const TopNavbar = ({ showNewQuote = true }: TopNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="border-b border-theme-border bg-theme-card/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <AppLogo size="sm" linkTo="/home" />
            
            {/* New Quote Button - Desktop */}
            {showNewQuote && (
              <Link to="/cashflow-generator" className="hidden sm:block">
                <Button 
                  size="sm"
                  className="gap-1.5 bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-medium h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Quote
                </Button>
              </Link>
            )}
          </div>

          {/* Center - Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 h-8 px-3 text-xs font-medium ${
                      active 
                        ? 'text-theme-accent bg-theme-accent/10' 
                        : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side - User Avatar */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-theme-card border-theme-border">
                <SheetHeader>
                  <SheetTitle className="text-theme-text">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {showNewQuote && (
                    <Link to="/cashflow-generator" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2 bg-theme-accent text-theme-bg hover:bg-theme-accent/90 mb-2">
                        <Plus className="w-4 h-4" />
                        New Quote
                      </Button>
                    </Link>
                  )}
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start gap-2 ${
                            active 
                              ? 'text-theme-accent bg-theme-accent/10' 
                              : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                  <div className="border-t border-theme-border my-3" />
                  <Link to="/account-settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-theme-text-muted hover:text-theme-text">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-theme-negative hover:text-theme-negative hover:bg-theme-negative/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            {/* User Dropdown - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8 border border-theme-border">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-theme-accent/20 text-theme-accent text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-theme-card border-theme-border">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-theme-text truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-theme-text-muted truncate">
                    {profile?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-theme-border" />
                <DropdownMenuItem asChild>
                  <Link to="/account-settings" className="gap-2 cursor-pointer text-theme-text">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-theme-border" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="gap-2 cursor-pointer text-theme-negative focus:text-theme-negative"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

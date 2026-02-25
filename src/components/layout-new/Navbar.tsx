import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Extract initials from user email or name
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-50 border-b border-theme-border/50 bg-theme-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A04A] to-[#B3893A] flex items-center justify-center shadow-lg shadow-[#B3893A]/20 group-hover:shadow-[#B3893A]/40 transition-shadow">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="font-display text-lg text-theme-text tracking-tight hidden sm:block">
              Dubai Invest
            </span>
          </Link>

          {/* Center: Nav links */}
          <div className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-theme-text-highlight bg-theme-accent/10'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card'
              }`}
            >
              Strategies
            </Link>
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-theme-card transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A04A]/20 to-[#B3893A]/20 border border-theme-accent/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-theme-accent">{initials}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-theme-card border-theme-border">
                <DropdownMenuItem
                  onClick={() => navigate('/account')}
                  className="text-theme-text hover:bg-theme-card-alt cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2 text-theme-text-muted" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-theme-negative hover:bg-theme-negative/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

import { Link } from 'react-router-dom';
import { ArrowLeft, Home, BarChart3, FileText, Scale, Presentation, LucideIcon, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ShortcutItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backLink?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  shortcuts?: ShortcutItem[];
  showLogo?: boolean;
}

// Default shortcuts for navigation
export const defaultShortcuts: ShortcutItem[] = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Generator', icon: Sparkles, href: '/cashflow-generator' },
  { label: 'All Quotes', icon: FileText, href: '/my-quotes' },
  { label: 'Compare', icon: Scale, href: '/compare' },
  { label: 'Presentations', icon: Presentation, href: '/presentations' },
  { label: 'Analytics', icon: BarChart3, href: '/quotes-analytics' },
  { label: 'Clients', icon: Users, href: '/clients' },
];

export const PageHeader = ({
  title,
  subtitle,
  icon,
  backLink,
  breadcrumbs,
  actions,
  shortcuts = defaultShortcuts,
  showLogo = true,
}: PageHeaderProps) => {
  return (
    <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo, Back, Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Logo */}
            {showLogo && (
              <div className="hidden sm:block">
                <AppLogo size="sm" collapsed linkTo="/home" />
              </div>
            )}
            
            {/* Divider */}
            {showLogo && (
              <div className="hidden sm:block w-px h-8 bg-theme-border" />
            )}

            {/* Back button */}
            {backLink && (
              <Link to={backLink}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {/* Title section */}
            <div className="min-w-0">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-xs text-theme-text-muted mb-0.5">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="opacity-50">/</span>}
                      {crumb.href ? (
                        <Link to={crumb.href} className="hover:text-theme-text transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-theme-text-muted">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              
              {/* Title with icon */}
              <div className="flex items-center gap-2">
                {icon && <span className="text-theme-accent shrink-0">{icon}</span>}
                <h1 className="text-lg sm:text-xl font-bold text-theme-text truncate">
                  {title}
                </h1>
              </div>
              
              {/* Subtitle */}
              {subtitle && (
                <p className="text-xs sm:text-sm text-theme-text-muted truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Shortcuts & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick shortcuts */}
            <TooltipProvider delayDuration={300}>
              <nav className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-theme-card/50 border border-theme-border">
                {shortcuts.map((shortcut, i) => {
                  const Icon = shortcut.icon;
                  const isActive = shortcut.active || (shortcut.href && window.location.pathname === shortcut.href);
                  
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        {shortcut.href ? (
                          <Link to={shortcut.href}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                isActive 
                                  ? 'text-theme-accent bg-theme-accent/10' 
                                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={shortcut.onClick}
                            className={`h-8 w-8 ${
                              isActive 
                                ? 'text-theme-accent bg-theme-accent/10' 
                                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-theme-card border-theme-border text-theme-text">
                        <p className="text-xs">{shortcut.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </nav>
            </TooltipProvider>

            {/* Custom actions */}
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
};

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  linkTo?: string;
  showGlow?: boolean;
  className?: string;
}

export const AppLogo = ({ 
  size = 'md', 
  collapsed = false, 
  linkTo = '/home',
  showGlow = false,
  className 
}: AppLogoProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  
  const sizeClasses = {
    sm: { container: 'w-7 h-7', icon: 'w-3.5 h-3.5', text: 'text-sm' },
    md: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
  };

  const sizes = sizeClasses[size];

  const logoContent = (
    <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2.5", className)}>
      <div className="relative flex-shrink-0">
        {/* Logo container - black bg with gold icon on light, gradient border on dark */}
        <div className={cn(
          sizes.container,
          "rounded-lg flex items-center justify-center",
          isLightTheme 
            ? "bg-gray-900" 
            : "bg-gradient-to-br from-theme-accent via-theme-accent-secondary to-theme-accent p-[1.5px]"
        )}>
          {isLightTheme ? (
            <svg viewBox="0 0 24 24" className={sizes.icon} fill="none">
              <path 
                d="M12 2L2 7L12 12L22 7L12 2Z" 
                stroke="currentColor" 
                className="text-theme-accent"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 17L12 22L22 17" 
                stroke="currentColor" 
                className="text-theme-accent"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 12L12 17L22 12" 
                stroke="currentColor" 
                className="text-theme-accent"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="w-full h-full rounded-[6px] bg-theme-card flex items-center justify-center">
              <svg viewBox="0 0 24 24" className={sizes.icon} fill="none">
                <path 
                  d="M12 2L2 7L12 12L22 7L12 2Z" 
                  stroke="currentColor" 
                  className="text-theme-accent"
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2 17L12 22L22 17" 
                  stroke="currentColor" 
                  className="text-theme-accent"
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2 12L12 17L22 12" 
                  stroke="currentColor" 
                  className="text-theme-accent"
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
        {showGlow && !isLightTheme && (
          <div className="absolute -inset-1 bg-theme-accent rounded-lg blur opacity-20" />
        )}
      </div>
      {!collapsed && (
        <span className={cn(sizes.text, "font-bold tracking-tight")}>
          <span className="text-theme-text">Dubai</span>
          <span className="text-theme-text">Invest</span>
          <span className="text-theme-accent">Pro</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

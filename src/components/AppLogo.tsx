import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  showGlow = true,
  className 
}: AppLogoProps) => {
  const sizeClasses = {
    sm: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-sm' },
    md: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
  };

  const sizes = sizeClasses[size];

  const logoContent = (
    <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2", className)}>
      <div className="relative flex-shrink-0">
        <div className={cn(
          sizes.container,
          "rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-[#CCFF00] p-[2px]"
        )}>
          <div className="w-full h-full rounded-lg bg-theme-card flex items-center justify-center">
            <svg viewBox="0 0 24 24" className={sizes.icon} fill="none">
              <path 
                d="M12 2L2 7L12 12L22 7L12 2Z" 
                stroke="url(#app-logo-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 17L12 22L22 17" 
                stroke="url(#app-logo-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 12L12 17L22 12" 
                stroke="url(#app-logo-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="app-logo-gradient" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#00EAFF" />
                  <stop offset="0.5" stopColor="#A855F7" />
                  <stop offset="1" stopColor="#CCFF00" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        {showGlow && (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-[#CCFF00] rounded-lg blur opacity-20 animate-pulse-slow" />
        )}
      </div>
      {!collapsed && (
        <span className={cn(sizes.text, "font-bold tracking-tight")}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-[#CCFF00]">Dubai</span>
          <span className="text-theme-text">Invest</span>
          <span className="text-[#CCFF00]">Pro</span>
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

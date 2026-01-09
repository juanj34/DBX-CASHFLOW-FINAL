import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutGrid, BarChart3, Presentation, Calculator } from "lucide-react";

interface TopNavBarProps {
  className?: string;
}

const navItems = [
  { label: "Generator", href: "/cashflow-generator", icon: Calculator },
  { label: "Opportunities", href: "/my-quotes", icon: LayoutGrid },
  { label: "Analytics", href: "/quotes-analytics", icon: BarChart3 },
  { label: "Presentations", href: "/presentations", icon: Presentation },
];

export const TopNavBar = ({ className }: TopNavBarProps) => {
  const location = useLocation();
  
  // Determine active based on current path
  const isActive = (href: string) => {
    if (href === "/cashflow-generator") {
      return location.pathname === "/cashflow-generator" || location.pathname.startsWith("/cashflow/");
    }
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <nav className={cn(
      "flex items-center gap-1 p-1 bg-theme-card/50 backdrop-blur-xl border border-theme-border rounded-xl",
      className
    )}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              active
                ? "bg-theme-accent text-theme-bg shadow-lg shadow-theme-accent/20"
                : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default TopNavBar;

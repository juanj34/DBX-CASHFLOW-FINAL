import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Show noise texture overlay */
  noise?: boolean;
}

/**
 * Page wrapper with Desert Deco background and optional noise texture.
 * Wraps every page for consistent background treatment.
 */
export const PageShell: React.FC<PageShellProps> = ({ children, className = '', noise = true }) => {
  return (
    <div className={`min-h-screen bg-theme-bg text-theme-text relative ${className}`}>
      {noise && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

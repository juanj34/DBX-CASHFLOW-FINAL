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
export const PageShell: React.FC<PageShellProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-theme-bg text-theme-text ${className}`}>
      {children}
    </div>
  );
};

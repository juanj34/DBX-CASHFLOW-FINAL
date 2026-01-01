import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="p-2 bg-theme-accent/20 rounded-xl">
        {icon}
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        <p className="text-xs sm:text-sm text-theme-text-muted">{subtitle}</p>
      </div>
    </div>
  );
};

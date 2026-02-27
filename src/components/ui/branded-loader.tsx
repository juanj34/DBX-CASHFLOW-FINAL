import React from 'react';

interface BrandedLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({ message, fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A04A] to-[#B3893A] animate-pulse" />
      <div className="mt-4 h-1.5 w-32 bg-theme-border rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-[#C9A04A] to-[#B3893A] rounded-full animate-shimmer" />
      </div>
      {message && <p className="text-sm text-theme-text-muted mt-4">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

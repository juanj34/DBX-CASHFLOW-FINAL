import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTierInfo } from './developerTrustScore';
import { useLanguage } from '@/contexts/LanguageContext';

interface TierBadgeProps {
  score: number;
  variant?: 'default' | 'compact' | 'large';
  showTooltip?: boolean;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  score,
  variant = 'default',
  showTooltip = true,
  className = '',
}) => {
  const { language } = useLanguage();
  const tier = getTierInfo(score);

  const sizeClasses = {
    compact: 'text-xs px-1.5 py-0.5 gap-1',
    default: 'text-sm px-2.5 py-1 gap-1.5',
    large: 'text-base px-3 py-1.5 gap-2',
  };

  const badge = (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap ${sizeClasses[variant]} ${className}`}
      style={{
        backgroundColor: tier.bgColor,
        color: tier.color,
        border: `1px solid ${tier.color}40`,
      }}
    >
      <span>{tier.emoji}</span>
      <span>{tier.label}</span>
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{tier.emoji} {tier.label}</p>
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? tier.descriptionEs : tier.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TierBadge;

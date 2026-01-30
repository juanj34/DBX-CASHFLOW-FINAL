import { User } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdvisorInfoProps {
  profile: Profile | null;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AdvisorInfo = ({ profile, size = 'sm', showSubtitle = false }: AdvisorInfoProps) => {
  const { t } = useLanguage();
  
  if (!profile) return null;

  const sizeConfig = {
    sm: { avatar: 'w-8 h-8', icon: 'w-4 h-4', name: 'text-sm', subtitle: 'text-xs' },
    md: { avatar: 'w-10 h-10', icon: 'w-5 h-5', name: 'text-base', subtitle: 'text-sm' },
    lg: { avatar: 'w-8 h-8 sm:w-12 sm:h-12', icon: 'w-4 h-4 sm:w-6 sm:h-6', name: 'text-sm sm:text-lg', subtitle: 'text-xs sm:text-sm' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <div className={`${config.avatar} rounded-full overflow-hidden bg-theme-card-alt flex-shrink-0 ring-2 ring-theme-accent/30`}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.full_name || 'Advisor'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${config.icon} text-theme-text-muted`} />
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        {profile.full_name && (
          <span className={`${config.name} text-theme-text font-medium leading-tight truncate max-w-[100px] sm:max-w-none`}>
            {profile.full_name}
          </span>
        )}
        {showSubtitle && (
          <span className={`${config.subtitle} text-theme-accent font-medium leading-tight hidden sm:block`}>
            {t('wealthAdvisor')}
          </span>
        )}
      </div>
    </div>
  );
};

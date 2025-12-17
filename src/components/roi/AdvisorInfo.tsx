import { User } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';

interface AdvisorInfoProps {
  profile: Profile | null;
  size?: 'sm' | 'md';
}

export const AdvisorInfo = ({ profile, size = 'sm' }: AdvisorInfoProps) => {
  if (!profile) return null;

  const avatarSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-2">
      <div className={`${avatarSize} rounded-full overflow-hidden bg-[#2a3142] flex-shrink-0`}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.full_name || 'Advisor'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${iconSize} text-gray-500`} />
          </div>
        )}
      </div>
      {profile.full_name && (
        <span className={`${textSize} text-white font-medium`}>
          {profile.full_name}
        </span>
      )}
    </div>
  );
};

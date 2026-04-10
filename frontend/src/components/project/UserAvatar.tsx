import React from 'react';
import { TeamMember } from '@/lib/types/project';

interface UserAvatarProps {
  user: TeamMember;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showStatus = false,
  className = '',
}) => {
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-block ${className}`}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClass} rounded-full border-2 border-white shadow-sm object-cover`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 ${statusColors[user.status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

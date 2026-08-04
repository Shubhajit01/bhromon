import type { ComponentProps } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';

import { useCurrentUser } from '../api/get-current-user';

export interface CurrentUserAvatarProps {
  image?: string | null;
  name: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join('')
    .toUpperCase();
}

function CurrentUserAvatar(props: ComponentProps<typeof Avatar>) {
  const { name, image, hash } = useCurrentUser();

  const avatarUrl = `https://api.dicebear.com/10.x/open-peeps/svg?seed=${hash}&size=32`;

  return (
    <Avatar {...props}>
      <AvatarImage src={image || avatarUrl} alt={name} />
      <AvatarFallback>{getInitials(name) || 'U'}</AvatarFallback>
    </Avatar>
  );
}

export { CurrentUserAvatar };

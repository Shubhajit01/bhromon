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
  const { name, image } = useCurrentUser();
  return (
    <Avatar {...props}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback>{getInitials(name) || 'U'}</AvatarFallback>
    </Avatar>
  );
}

export { CurrentUserAvatar };

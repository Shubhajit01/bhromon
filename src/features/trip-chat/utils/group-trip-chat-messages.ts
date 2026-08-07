import type { TripChatMessage } from '../types/trip-chat-message';

export interface TripChatMessageGroup {
  id: string;
  role: TripChatMessage['role'];
  messages: TripChatMessage[];
}

export function groupTripChatMessages(
  messages: TripChatMessage[],
): TripChatMessageGroup[] {
  const groups: TripChatMessageGroup[] = [];

  for (const message of messages) {
    if (!message.parts.length) {
      continue;
    }

    const lastGroup = groups.at(-1);
    if (lastGroup?.role === message.role) {
      lastGroup.messages.push(message);
      continue;
    }

    groups.push({
      id: message.id,
      role: message.role,
      messages: [message],
    });
  }

  return groups;
}

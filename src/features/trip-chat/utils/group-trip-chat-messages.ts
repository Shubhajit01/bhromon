import type { UIMessage } from 'ai';

export interface TripChatMessageGroup {
  id: string;
  role: UIMessage['role'];
  messages: UIMessage[];
}

export function groupTripChatMessages(
  messages: UIMessage[],
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

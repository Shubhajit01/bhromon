import { AIChatAgent } from '@cloudflare/ai-chat';
import { getAgentByName } from 'agents';
import { convertToModelMessages, streamText } from 'ai';
import { env } from 'cloudflare:workers';
import { createWorkersAI } from 'workers-ai-provider';

import type { OnChatMessageOptions } from '@cloudflare/ai-chat';

import { userTimeContextSchema } from '../../utils/user-time-context';
import { createTripAgentSystemPrompt } from './prompt';

import type {
  TripChatMessage,
  TripChatMessageMetadata,
} from '../../types/trip-chat-message';
import type { UserTimeContext } from '../../utils/user-time-context';

interface TripAgentState {
  userTimeContext: UserTimeContext | null;
}

export class TripAgent extends AIChatAgent<Env, TripAgentState> {
  initialState: TripAgentState = { userTimeContext: null };

  async persistInitialPrompt(prompt: string, userTimeContext: UserTimeContext) {
    this.setState({ userTimeContext });

    await this.saveMessages([
      ...this.messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: prompt }],
      },
    ]);
  }

  async requestReply() {
    return this.saveMessages(this.messages);
  }

  async onChatMessage(
    _onFinish: Parameters<AIChatAgent['onChatMessage']>[0],
    options?: OnChatMessageOptions,
  ) {
    const requestTimeContext = userTimeContextSchema.safeParse(
      options?.body?.userTimeContext,
    );
    const storedTimeContext = userTimeContextSchema.safeParse(
      this.state.userTimeContext,
    );
    const userTimeContext = requestTimeContext.success
      ? requestTimeContext.data
      : storedTimeContext.success
        ? storedTimeContext.data
        : null;

    if (requestTimeContext.success) {
      this.setState({ userTimeContext });
    }

    const workersAI = createWorkersAI({ binding: this.env.AI });
    let reasoningStartedAt: number | undefined;
    const result = streamText({
      model: workersAI('@cf/zai-org/glm-4.7-flash'),
      instructions: createTripAgentSystemPrompt(userTimeContext),
      messages: await convertToModelMessages(this.messages),
    });

    return result.toUIMessageStreamResponse<TripChatMessage>({
      messageMetadata: ({ part }): TripChatMessageMetadata | undefined => {
        if (part.type === 'reasoning-start') {
          reasoningStartedAt = Date.now();
          return { reasoningStartedAt };
        }

        if (part.type === 'reasoning-end' && reasoningStartedAt !== undefined) {
          const reasoningEndedAt = Date.now();

          return {
            reasoningStartedAt,
            reasoningEndedAt,
            reasoningDurationMs: reasoningEndedAt - reasoningStartedAt,
          };
        }

        return undefined;
      },
    });
  }

  getMessages(): TripChatMessage[] {
    return this.messages as TripChatMessage[];
  }
}

export function getTripAgent(id: string) {
  return getAgentByName<Env, TripAgent>(env.TripAgent, id);
}

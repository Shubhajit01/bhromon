import { AIChatAgent } from '@cloudflare/ai-chat';
import { getCurrentAgent } from 'agents';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';

import type { OnChatMessageOptions } from '@cloudflare/ai-chat';
import type { Connection, ConnectionContext } from 'agents';

import { userTimeContextSchema } from '../../utils/user-time-context';
import { createTripAgentSystemPrompt } from './prompt';
import { createTripAgentTools } from './tools';

import type {
  TripChatMessage,
  TripChatMessageMetadata,
} from '../../types/trip-chat-message';
import type { UserTimeContext } from '../../utils/user-time-context';

interface TripAgentState {
  userTimeContext: UserTimeContext | null;
}

const tripAgentConnectionStateSchema = z.object({
  authorization: z.string().optional(),
  cookie: z.string().optional(),
});

type TripAgentConnectionState = z.infer<typeof tripAgentConnectionStateSchema>;

export class TripAgent extends AIChatAgent<Env, TripAgentState> {
  initialState: TripAgentState = { userTimeContext: null };

  onConnect(
    connection: Connection<TripAgentConnectionState>,
    context: ConnectionContext,
  ) {
    const authorization = context.request.headers.get('authorization');
    const cookie = context.request.headers.get('cookie');

    connection.setState({
      ...(authorization ? { authorization } : {}),
      ...(cookie ? { cookie } : {}),
    });
  }

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
    const tools = createTripAgentTools({
      tripId: this.name,
      authHeaders: this.getAuthHeaders(),
    });

    let reasoningStartedAt: number | undefined;
    const result = streamText({
      reasoning: 'medium',
      model: workersAI('@cf/zai-org/glm-4.7-flash'),
      instructions: createTripAgentSystemPrompt(userTimeContext),
      messages: await convertToModelMessages(this.messages),
      tools,
      toolApproval: { saveItinerary: 'user-approval' },
      stopWhen: isStepCount(3),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream<typeof tools, TripChatMessage>({
        stream: result.stream,
        messageMetadata: ({ part }): TripChatMessageMetadata | undefined => {
          if (part.type === 'reasoning-start') {
            reasoningStartedAt = Date.now();
            return { reasoningStartedAt };
          }

          if (
            part.type === 'reasoning-end' &&
            reasoningStartedAt !== undefined
          ) {
            const reasoningEndedAt = Date.now();

            return {
              reasoningStartedAt,
              reasoningEndedAt,
              reasoningDurationMs: reasoningEndedAt - reasoningStartedAt,
            };
          }

          return undefined;
        },
      }),
    });
  }

  private getAuthHeaders() {
    const state = getCurrentAgent().connection?.state;

    const { authorization, cookie } =
      tripAgentConnectionStateSchema.parse(state);

    const headers = new Headers();
    [
      ['Authorization', authorization],
      ['Cookie', cookie],
    ].forEach(([key, value]) => {
      if (value) {
        headers.set(key!, value);
      }
    });

    return headers;
  }

  getMessages(): TripChatMessage[] {
    return this.messages as TripChatMessage[];
  }
}

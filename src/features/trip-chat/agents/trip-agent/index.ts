import { AIChatAgent } from '@cloudflare/ai-chat';
import { date, diffMilliseconds, format } from '@formkit/tempo';
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

import type { Connection, ConnectionContext } from 'agents';

import {
  getUserTimeZoneFromCookie,
  isSupportedTimeZone,
} from '#/utils/user-time-zone';

import { createTripAgentSystemPrompt } from './prompt';
import { createTripAgentTools } from './tools';

import type {
  TripChatMessage,
  TripChatMessageMetadata,
} from '../../types/trip-chat-message';

interface TripAgentState {
  userTimeZone: string | null;
}

const tripAgentConnectionStateSchema = z.object({
  authorization: z.string().optional(),
  cookie: z.string().optional(),
});

type TripAgentConnectionState = z.infer<typeof tripAgentConnectionStateSchema>;

export class TripAgent extends AIChatAgent<Env, TripAgentState> {
  initialState: TripAgentState = { userTimeZone: null };

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

  async persistInitialPrompt(prompt: string, userTimeZone: string) {
    this.setState({ userTimeZone });

    await this.persistMessages([
      ...this.messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: prompt }],
      },
    ]);

    void this.requestReply().catch((error: unknown) => {
      console.error('Unable to generate the initial trip reply', error);
    });
  }

  async requestReply() {
    return this.saveMessages(this.messages);
  }

  async onChatMessage(_onFinish: Parameters<AIChatAgent['onChatMessage']>[0]) {
    const connectionState = tripAgentConnectionStateSchema.safeParse(
      getCurrentAgent().connection?.state,
    );
    const connectionCookie = connectionState.success
      ? connectionState.data.cookie
      : undefined;
    const connectionTimeZone = connectionCookie
      ? getUserTimeZoneFromCookie(connectionCookie)
      : null;
    const storedTimeZone = isSupportedTimeZone(this.state.userTimeZone ?? '')
      ? this.state.userTimeZone
      : null;
    const userTimeZone = connectionTimeZone ?? storedTimeZone ?? 'UTC';

    if (connectionTimeZone && connectionTimeZone !== storedTimeZone) {
      this.setState({ userTimeZone: connectionTimeZone });
    }

    const workersAI = createWorkersAI({ binding: this.env.AI });
    const tools = createTripAgentTools({
      tripId: this.name,
      authHeaders: this.getAuthHeaders(),
    });

    let reasoningStartedAt: string | undefined;
    const result = streamText({
      reasoning: 'medium',
      model: workersAI('@cf/zai-org/glm-4.7-flash'),
      instructions: createTripAgentSystemPrompt(userTimeZone),
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
            reasoningStartedAt = format(date(), 'ISO8601');
            return { reasoningStartedAt };
          }

          if (
            part.type === 'reasoning-end' &&
            reasoningStartedAt !== undefined
          ) {
            const reasoningEndedAt = format(date(), 'ISO8601');

            return {
              reasoningStartedAt,
              reasoningEndedAt,
              reasoningDurationMs: diffMilliseconds(
                reasoningEndedAt,
                reasoningStartedAt,
              ),
            };
          }

          return undefined;
        },
      }),
    });
  }

  private getAuthHeaders() {
    const state = getCurrentAgent().connection?.state;
    const connectionState = tripAgentConnectionStateSchema.safeParse(state);
    const { authorization, cookie } = connectionState.success
      ? connectionState.data
      : {};

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

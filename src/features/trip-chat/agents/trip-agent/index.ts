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

import { createLogger, elapsedMilliseconds } from '#/lib/logger';
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

const logger = createLogger('trip-agent');
const CHAT_MODEL = '@cf/zai-org/glm-4.7-flash';

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

    logger.info('trip_agent.connection.opened', {
      connectionId: connection.id,
      hasAuthorization: Boolean(authorization),
      hasCookie: Boolean(cookie),
      tripId: this.name,
    });
  }

  onClose(
    connection: Connection<TripAgentConnectionState>,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    logger.info('trip_agent.connection.closed', {
      closeCode: code,
      closeReason: reason,
      connectionId: connection.id,
      tripId: this.name,
      wasClean,
    });
  }

  async persistInitialPrompt(prompt: string, userTimeZone: string) {
    const startedAt = performance.now();
    logger.info('trip_agent.initial_prompt.started', {
      existingMessageCount: this.messages.length,
      promptLength: prompt.length,
      tripId: this.name,
      userTimeZone,
    });

    this.setState({ userTimeZone });

    await this.persistMessages([
      ...this.messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: prompt }],
      },
    ]);

    logger.info('trip_agent.initial_prompt.persisted', {
      durationMs: elapsedMilliseconds(startedAt),
      messageCount: this.messages.length,
      tripId: this.name,
    });

    void this.requestReply().catch((error: unknown) => {
      logger.error('trip_agent.initial_reply.failed', error, {
        tripId: this.name,
      });
    });

    logger.info('trip_agent.initial_reply.scheduled', { tripId: this.name });
  }

  async requestReply() {
    const startedAt = performance.now();
    logger.info('trip_agent.reply_request.started', {
      messageCount: this.messages.length,
      tripId: this.name,
    });

    try {
      const result = await this.saveMessages(this.messages);
      logger.info('trip_agent.reply_request.completed', {
        durationMs: elapsedMilliseconds(startedAt),
        messageCount: this.messages.length,
        tripId: this.name,
      });
      return result;
    } catch (error) {
      logger.error('trip_agent.reply_request.failed', error, {
        durationMs: elapsedMilliseconds(startedAt),
        tripId: this.name,
      });
      throw error;
    }
  }

  async onChatMessage(_onFinish: Parameters<AIChatAgent['onChatMessage']>[0]) {
    const startedAt = performance.now();
    const currentAgent = getCurrentAgent();
    const connectionState = tripAgentConnectionStateSchema.safeParse(
      currentAgent.connection?.state,
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

    logger.info('trip_agent.generation.started', {
      connectionId: currentAgent.connection?.id,
      messageCount: this.messages.length,
      model: CHAT_MODEL,
      timeZoneSource: connectionTimeZone
        ? 'connection'
        : storedTimeZone
          ? 'stored'
          : 'default',
      tripId: this.name,
      userTimeZone,
    });

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
      model: workersAI(CHAT_MODEL),
      instructions: createTripAgentSystemPrompt(userTimeZone),
      messages: await convertToModelMessages(this.messages),
      tools,
      toolApproval: { saveItinerary: 'user-approval' },
      stopWhen: isStepCount(3),
      onAbort: ({ steps }) => {
        logger.warn('trip_agent.generation.aborted', {
          durationMs: elapsedMilliseconds(startedAt),
          stepCount: steps.length,
          tripId: this.name,
        });
      },
      onError: ({ error }) => {
        logger.error('trip_agent.generation.stream_failed', error, {
          durationMs: elapsedMilliseconds(startedAt),
          tripId: this.name,
        });
      },
      onFinish: ({ finishReason, stepNumber, usage }) => {
        logger.info('trip_agent.generation.completed', {
          durationMs: elapsedMilliseconds(startedAt),
          finishReason,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          stepCount: stepNumber + 1,
          tripId: this.name,
        });
      },
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

import startServer from '@tanstack/react-start/server-entry';

import { routeAgentRequest } from 'agents';

import {
  requireTripAgentAccess,
  TripAgentAccessError,
} from '#/features/trip-chat/agents/trip-agent/require-trip-agent-access.server';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';
import {
  getTimeZoneBootstrapResponse,
  getTimeZoneFallbackResponse,
  needsTimeZoneCookie,
} from '#/utils/time-zone.server';

export { TripAgent } from '#/features/trip-chat/agents/trip-agent';

interface AgentLobby {
  className: string;
  name: string;
}

const logger = createLogger('server');
const SLOW_REQUEST_THRESHOLD_MS = 1_000;

async function authorizeTripAgentRequest(request: Request, lobby: AgentLobby) {
  if (lobby.className !== 'TripAgent') {
    return;
  }

  const startedAt = performance.now();
  try {
    await requireTripAgentAccess({
      headers: request.headers,
      tripId: lobby.name,
    });
  } catch (error) {
    if (error instanceof TripAgentAccessError) {
      logger.warn('server.agent_authorization.denied', {
        durationMs: elapsedMilliseconds(startedAt),
        status: error.status,
        tripId: lobby.name,
      });
      return new Response(error.message, { status: error.status });
    }

    logger.error('server.agent_authorization.failed', error, {
      durationMs: elapsedMilliseconds(startedAt),
      tripId: lobby.name,
    });
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const startedAt = performance.now();
    const requestUrl = new URL(request.url);
    const requestFields = {
      cfRay: request.headers.get('cf-ray') ?? undefined,
      method: request.method,
      pathname: requestUrl.pathname,
    };

    const timeZoneFallbackResponse = getTimeZoneFallbackResponse(request);

    if (timeZoneFallbackResponse) return timeZoneFallbackResponse;

    if (needsTimeZoneCookie(request)) {
      const response = getTimeZoneBootstrapResponse();
      return response;
    }

    try {
      const agentResponse = await routeAgentRequest(request, env, {
        onBeforeConnect: authorizeTripAgentRequest,
        onBeforeRequest: authorizeTripAgentRequest,
      });
      const handler = agentResponse ? 'agent' : 'tanstack-start';
      const response = agentResponse ?? (await startServer.fetch(request));

      const durationMs = elapsedMilliseconds(startedAt);
      if (durationMs >= SLOW_REQUEST_THRESHOLD_MS || response.status >= 400) {
        logger.info('server.request.completed', {
          ...requestFields,
          durationMs,
          handler,
          status: response.status,
        });
      }
      return response;
    } catch (error) {
      logger.error('server.request.failed', error, {
        ...requestFields,
        durationMs: elapsedMilliseconds(startedAt),
      });
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;

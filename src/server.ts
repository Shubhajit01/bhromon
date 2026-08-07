import startServer from '@tanstack/react-start/server-entry';

import { routeAgentRequest } from 'agents';

import {
  requireTripAgentAccess,
  TripAgentAccessError,
} from '#/features/trip-chat/agents/trip-agent/require-trip-agent-access.server';

export { TripAgent } from '#/features/trip-chat/agents/trip-agent';

interface AgentLobby {
  className: string;
  name: string;
}

async function authorizeTripAgentRequest(request: Request, lobby: AgentLobby) {
  if (lobby.className !== 'TripAgent') {
    return;
  }

  try {
    await requireTripAgentAccess({
      headers: request.headers,
      tripId: lobby.name,
    });
  } catch (error) {
    if (error instanceof TripAgentAccessError) {
      return new Response(error.message, { status: error.status });
    }

    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const agentResponse = await routeAgentRequest(request, env, {
      onBeforeConnect: authorizeTripAgentRequest,
      onBeforeRequest: authorizeTripAgentRequest,
    });

    return agentResponse ?? startServer.fetch(request);
  },
} satisfies ExportedHandler<Env>;

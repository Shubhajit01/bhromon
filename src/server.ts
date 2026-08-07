import startServer from '@tanstack/react-start/server-entry';

import { routeAgentRequest } from 'agents';

export { TripAgent } from '#/features/trip-chat/agents/trip-agent';

export default {
  async fetch(request: Request, env: Env) {
    const agentResponse = await routeAgentRequest(request, env);

    return agentResponse ?? startServer.fetch(request);
  },
} satisfies ExportedHandler<Env>;

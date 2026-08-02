import { createFileRoute } from '@tanstack/react-router';

import { useAgentChat } from '@cloudflare/ai-chat/react';
import { useAgent } from 'agents/react';

export const Route = createFileRoute('/_protected/t/$tripId/chat')({
  component: Trip,
  async loader() {},
});

function Trip() {
  const { tripId } = Route.useParams();

  const agent = useAgent({ name: tripId, agent: 'TripAgent' });
  const { messages, sendMessage, status } = useAgentChat({ agent });

  return (
    <main className="p-6">
      {agent.name} {status}
      <pre>{JSON.stringify(messages, null, 2)}</pre>
    </main>
  );
}

import { AIChatAgent } from '@cloudflare/ai-chat';
import { getAgentByName } from 'agents';
import { env } from 'cloudflare:workers';

export class TripAgent extends AIChatAgent {
  async persistInitialPrompt(prompt: string) {
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

  async onChatMessage() {
    return new Response('I am ready to help plan this trip.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  getMessages() {
    return this.messages;
  }
}

export function getTripAgent(id: string) {
  return getAgentByName<Env, TripAgent>(env.TripAgent, id);
}

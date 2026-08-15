import { generateText, Output } from 'ai';
import { env } from 'cloudflare:workers';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';

import { createLogger, elapsedMilliseconds } from '#/lib/logger';

const logger = createLogger('trip-title');
const TITLE_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

export const generateTripTitleSchema = z.object({
  diagnosticId: z.string().uuid().optional(),
  prompt: z.string(),
});

export type GenerateTripTitleInput = z.infer<typeof generateTripTitleSchema>;

const tripTitleOutputSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

export async function generateTripTitle(data: GenerateTripTitleInput) {
  const startedAt = performance.now();
  const workersai = createWorkersAI({ binding: env.AI });
  const model = workersai(TITLE_MODEL);

  logger.info('trip_title.generation.started', {
    diagnosticId: data.diagnosticId,
    model: TITLE_MODEL,
    promptLength: data.prompt.length,
  });

  try {
    const { output } = await generateText({
      model,
      instructions:
        'You are a writer.' +
        'You understand a piece of text and provides a title that suits that piece of text.\n' +
        'Task: You will be given user prompt that starts a chat thread. Your task is to generate a short title from it.\n\n' +
        'Rules:\n' +
        '1. If the user is trying to abuse or use foul language - simply write Foul and abuse\n' +
        '2. If you cannot understand the text generate a random text\n' +
        '3. Do NOT give the same text back as title\n' +
        '4. Title should be around 3-4 words max\n' +
        '5. If you encounter PII data, ignore it - do NOT use it in the title',
      prompt:
        'Here is the user initial prompt. Generate title for this:\n' +
        'Prompt:\n\n' +
        data.prompt,
      output: Output.object({ schema: tripTitleOutputSchema }),
    });

    logger.info('trip_title.generation.completed', {
      diagnosticId: data.diagnosticId,
      durationMs: elapsedMilliseconds(startedAt),
      titleLength: output.title.length,
    });

    return output.title;
  } catch (error) {
    logger.error('trip_title.generation.failed', error, {
      diagnosticId: data.diagnosticId,
      durationMs: elapsedMilliseconds(startedAt),
      model: TITLE_MODEL,
    });
    throw error;
  }
}

import { z } from 'zod';

export const createCallSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  campaignId: z.string().uuid('Invalid campaign ID').optional().nullable(),
  provider: z.string().default('simulated'),
  direction: z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  language: z.string().default('en'),
});

export const updateCallSchema = z.object({
  status: z.enum([
    'queued',
    'dialing',
    'ringing',
    'connected',
    'voicemail',
    'retry_scheduled',
    'callback_scheduled',
    'completed',
    'interested',
    'not_interested',
    'failed',
  ]).optional(),
  startedAt: z.string().optional().nullable(),
  endedAt: z.string().optional().nullable(),
  durationSeconds: z.number().int().min(0).optional(),
  outcome: z.string().optional().nullable(),
  intent: z.string().optional().nullable(),
  prospectResponseStatus: z.enum(['INTERESTED', 'NOT_INTERESTED', 'CALLBACK_REQUESTED', 'HANDOFF']).optional().nullable(),
  transcript: z.object({
    transcriptText: z.string(),
    speakerSegments: z.array(
      z.object({
        speaker: z.enum(['Agent', 'Prospect']),
        timestamp: z.string(),
        text: z.string(),
      })
    ),
  }).optional(),
  summary: z.object({
    summaryText: z.string(),
    keyTakeaways: z.array(z.string()),
    objectionsRaised: z.array(z.string()),
    sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
    nextBestAction: z.string(),
  }).optional(),
});

export const simulateCallSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  campaignId: z.string().uuid().optional().nullable(),
  direction: z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  language: z.string().default('en'),
  scenario: z.enum(['interested', 'objection_handled', 'voicemail', 'not_interested', 'handoff_scheduled']).default('interested'),
});

export type CreateCallInput = z.infer<typeof createCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
export type SimulateCallInput = z.infer<typeof simulateCallSchema>;

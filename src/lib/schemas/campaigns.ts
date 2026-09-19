import { z } from 'zod';

export const campaignConfigSchema = z.object({
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  calling_window_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').default('09:00'),
  calling_window_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').default('17:00'),
  retry_count: z.number().int().min(0).max(10).default(3),
  voicemail_enabled: z.boolean().default(true),
  callback_enabled: z.boolean().default(true),
  frequency: z.string().default('immediate'),
});

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  type: z.enum(['CALLING_ONLY', 'LEADS_AND_CALLING']).default('LEADS_AND_CALLING'),
  targetTimezone: z.string().default('UTC'),
  scheduleCron: z.string().optional().nullable(),
  config: campaignConfigSchema.default({
    language: 'en',
    timezone: 'UTC',
    calling_window_start: '09:00',
    calling_window_end: '17:00',
    retry_count: 3,
    voicemail_enabled: true,
    callback_enabled: true,
    frequency: 'immediate',
  }),
  voiceScriptId: z.string().uuid().optional().nullable(),
  leadIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const updateCampaignStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
});

export type CreateCampaignInput = z.input<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.input<typeof updateCampaignSchema>;
export type UpdateCampaignStatusInput = z.infer<typeof updateCampaignStatusSchema>;

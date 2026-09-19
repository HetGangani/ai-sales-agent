import { z } from 'zod';

export const leadContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  businessEmail: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().or(z.literal('')).nullable(),
  jobTitle: z.string().optional().or(z.literal('')).nullable(),
  linkedinProfile: z.string().optional().or(z.literal('')).nullable(),
  isVerified: z.boolean().default(false),
});

export const createLeadSchema = z.object({
  sourcePlatform: z.enum([
    'linkedin',
    'x',
    'company_website',
    'public_directory',
    'job_platform',
    'freelance_platform',
    'crm',
  ]),
  originalPostUrl: z.string().url('Invalid source post URL'),
  discoveryDate: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  companyWebsite: z.string().optional().or(z.literal('')).nullable(),
  industry: z.string().optional().or(z.literal('')).nullable(),
  companySize: z.string().optional().or(z.literal('')).nullable(),
  location: z.string().optional().or(z.literal('')).nullable(),
  requirement: z.string().min(5, 'Requirement description must be at least 5 characters'),
  intentScore: z.number().int().min(0).max(100).default(50),
  qualificationStatus: z
    .enum(['UNQUALIFIED', 'REVIEW_PENDING', 'QUALIFIED', 'DISQUALIFIED', 'HANDOFF_REQUIRED'])
    .default('REVIEW_PENDING'),
  leadStatus: z
    .enum(['DISCOVERED', 'ENRICHED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED'])
    .default('DISCOVERED'),
  aiReasoning: z.string().optional().nullable(),
  isSimulated: z.boolean().default(false),
  contacts: z.array(leadContactSchema).optional().default([]),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQueryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  sourcePlatform: z.string().optional(),
  qualificationStatus: z.string().optional(),
  leadStatus: z.string().optional(),
  minIntentScore: z.coerce.number().int().min(0).max(100).optional(),
  maxIntentScore: z.coerce.number().int().min(0).max(100).optional(),
  isSimulated: z.coerce.boolean().optional(),
  sortBy: z.enum(['created_at', 'intent_score', 'company_name', 'discovery_date']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkUpdateLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')),
  qualificationStatus: z
    .enum(['UNQUALIFIED', 'REVIEW_PENDING', 'QUALIFIED', 'DISQUALIFIED', 'HANDOFF_REQUIRED'])
    .optional(),
  leadStatus: z
    .enum(['DISCOVERED', 'ENRICHED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED'])
    .optional(),
});

export const bulkAssignCampaignSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')),
  campaignId: z.string().uuid('Invalid campaign ID'),
});

export const importConfirmSchema = z.object({
  leads: z.array(createLeadSchema),
  deduplicationStrategy: z.enum(['skip', 'overwrite', 'merge']).default('skip'),
});

export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type UpdateLeadInput = z.input<typeof updateLeadSchema>;
export type LeadQueryFilter = z.input<typeof leadQueryFilterSchema>;
export type BulkUpdateLeadsInput = z.infer<typeof bulkUpdateLeadsSchema>;
export type BulkAssignCampaignInput = z.infer<typeof bulkAssignCampaignSchema>;
export type ImportConfirmInput = z.infer<typeof importConfirmSchema>;

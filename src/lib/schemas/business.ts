import { z } from 'zod';

export const businessProfileSchema = z.object({
  websiteUrl: z.string().url('Invalid website URL'),
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  overview: z.string().optional(),
  targetIcp: z.record(z.string(), z.any()).optional(),
  aiSummary: z.string().optional(),
});

export const productServiceSchema = z.object({
  name: z.string().min(2, 'Product or service name is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  valueProposition: z.string().optional(),
  faqData: z.array(
    z.object({
      question: z.string().min(1, 'Question cannot be empty'),
      answer: z.string().min(1, 'Answer cannot be empty'),
    })
  ).default([]),
  aiSuitabilityStatus: z.enum(['APPROVED', 'PENDING_REVIEW', 'REJECTED']).default('PENDING_REVIEW'),
  suitabilityScore: z.number().min(0).max(1).optional(),
});

export const documentUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileType: z.string().min(1, 'File type is required'),
  parsedText: z.string().optional(),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type ProductServiceInput = z.infer<typeof productServiceSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

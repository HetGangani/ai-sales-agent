import * as XLSX from 'xlsx';
import { db } from '@/lib/db/repository';
import { CreateLeadInput } from '@/lib/schemas/leads';
import { Lead, LeadSourcePlatform } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';
import { trackBulkOperation } from '@/lib/security/fraud-detector';

export interface RawImportRow {
  name?: string;
  contactName?: string;
  contact_name?: string;
  email?: string;
  businessEmail?: string;
  business_email?: string;
  phone?: string;
  phone_number?: string;
  linkedin?: string;
  linkedinProfile?: string;
  linkedin_profile?: string;
  company?: string;
  companyName?: string;
  company_name?: string;
  website?: string;
  companyWebsite?: string;
  company_website?: string;
  jobTitle?: string;
  job_title?: string;
  industry?: string;
  companySize?: string;
  company_size?: string;
  location?: string;
  requirement?: string;
  sourcePlatform?: string;
  source_platform?: string;
  originalPostUrl?: string;
  original_post_url?: string;
  intentScore?: string | number;
  intent_score?: string | number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface DuplicateMatch {
  row: number;
  matchedBy: 'email' | 'phone' | 'linkedin' | 'company_and_name';
  existingLeadId: string;
  existingCompanyName: string;
  existingContactName?: string;
  existingValue: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ImportError[];
  duplicates: DuplicateMatch[];
  normalizedLeads: CreateLeadInput[];
}

export class ImportExportService {
  /**
   * Parses buffer of CSV or Excel (.xlsx) file into raw object rows
   */
  parseFileBuffer(buffer: Buffer): RawImportRow[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new AppError('The uploaded workbook contains no sheets.', 'VALIDATION_ERROR', 400);
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<RawImportRow>(sheet, { defval: '' });
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new AppError(`Failed to parse spreadsheet file: ${msg}`, 'PARSING_ERROR', 400);
    }
  }

  /**
   * Normalizes phone number format
   */
  normalizePhone(phone?: string): string | null {
    if (!phone) return null;
    const clean = phone.trim();
    return clean.length >= 7 ? clean : null;
  }

  /**
   * Normalizes email address
   */
  normalizeEmail(email?: string): string | null {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(clean) ? clean : null;
  }

  /**
   * Normalizes URL
   */
  normalizeUrl(url?: string, defaultDomain?: string): string {
    if (!url || url.trim() === '') {
      return defaultDomain ? `https://${defaultDomain}.com/lead` : 'https://linkedin.com/posts/discovered';
    }
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    return `https://${clean}`;
  }

  /**
   * Normalizes raw rows into validated CreateLeadInput objects
   */
  validateAndNormalizeRow(
    row: RawImportRow,
    rowIndex: number,
    errors: ImportError[]
  ): CreateLeadInput | null {
    const companyName = (row.companyName || row.company || row.company_name || '').toString().trim();
    if (!companyName) {
      errors.push({ row: rowIndex, field: 'companyName', message: 'Company name is required.' });
    }

    const requirement = (row.requirement || '').toString().trim();
    if (!requirement || requirement.length < 3) {
      errors.push({
        row: rowIndex,
        field: 'requirement',
        message: 'Requirement description must be at least 3 characters.',
      });
    }

    const contactName = (row.contactName || row.name || row.contact_name || '').toString().trim();
    const email = this.normalizeEmail(row.businessEmail || row.email || row.business_email?.toString());
    const phone = this.normalizePhone(row.phone || row.phone_number?.toString());
    const linkedin = (row.linkedinProfile || row.linkedin || row.linkedin_profile || '').toString().trim() || null;
    const jobTitle = (row.jobTitle || row.job_title || '').toString().trim() || null;

    const rawPlatform = (row.sourcePlatform || row.source_platform || 'public_directory').toString().toLowerCase().trim();
    const validPlatforms = [
      'linkedin',
      'x',
      'company_website',
      'public_directory',
      'job_platform',
      'freelance_platform',
      'crm',
    ] as const;
    const sourcePlatform: LeadSourcePlatform = validPlatforms.includes(rawPlatform as (typeof validPlatforms)[number])
      ? (rawPlatform as LeadSourcePlatform)
      : 'public_directory';

    const originalPostUrl = this.normalizeUrl(
      row.originalPostUrl || row.original_post_url?.toString(),
      companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    let intentScore = 50;
    const rawIntent = row.intentScore || row.intent_score;
    if (rawIntent !== undefined && rawIntent !== '') {
      const parsed = parseInt(rawIntent.toString(), 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        intentScore = parsed;
      }
    }

    if (!companyName || !requirement) {
      return null;
    }

    const contacts = contactName || email || phone || linkedin
      ? [
          {
            name: contactName || 'Primary Contact',
            businessEmail: email,
            phone,
            jobTitle,
            linkedinProfile: linkedin,
            isVerified: Boolean(email && phone),
          },
        ]
      : [];

    return {
      sourcePlatform,
      originalPostUrl,
      companyName,
      companyWebsite: row.companyWebsite || row.website || row.company_website?.toString() || null,
      industry: row.industry?.toString() || null,
      companySize: row.companySize || row.company_size?.toString() || null,
      location: row.location?.toString() || null,
      requirement,
      intentScore,
      qualificationStatus: intentScore >= 80 ? 'QUALIFIED' : 'REVIEW_PENDING',
      leadStatus: 'DISCOVERED',
      aiReasoning: 'Imported via spreadsheet batch file.',
      isSimulated: false,
      contacts,
    };
  }

  /**
   * Detects duplicate records using 4 distinct strategies
   */
  async detectDuplicates(
    orgId: string,
    normalizedLeads: Array<{ lead: CreateLeadInput; rowIndex: number }>
  ): Promise<DuplicateMatch[]> {
    const existingLeads = (await db.leadRepo.query(orgId, { limit: 1000 })).items;
    const existingContacts = await db.contactRepo.listAllForOrg(orgId);

    // Build lookup indexes
    const emailIndex = new Map<string, { leadId: string; companyName: string }>();
    const phoneIndex = new Map<string, { leadId: string; companyName: string }>();
    const linkedinIndex = new Map<string, { leadId: string; companyName: string }>();
    const companyNameIndex = new Map<string, { leadId: string; companyName: string; contacts: Set<string> }>();

    existingLeads.forEach((l) => {
      const cNameNorm = l.company_name.toLowerCase().trim();
      if (!companyNameIndex.has(cNameNorm)) {
        companyNameIndex.set(cNameNorm, { leadId: l.id, companyName: l.company_name, contacts: new Set() });
      }
    });

    existingContacts.forEach((c) => {
      const parentLead = existingLeads.find((l) => l.id === c.lead_id);
      const companyName = parentLead ? parentLead.company_name : 'Existing Lead';

      if (c.business_email) {
        emailIndex.set(c.business_email.toLowerCase().trim(), { leadId: c.lead_id, companyName });
      }
      if (c.phone) {
        phoneIndex.set(c.phone.replace(/[^0-9]/g, ''), { leadId: c.lead_id, companyName });
      }
      if (c.linkedin_profile) {
        linkedinIndex.set(c.linkedin_profile.toLowerCase().trim(), { leadId: c.lead_id, companyName });
      }
      if (parentLead && c.name) {
        const cEntry = companyNameIndex.get(parentLead.company_name.toLowerCase().trim());
        if (cEntry) {
          cEntry.contacts.add(c.name.toLowerCase().trim());
        }
      }
    });

    const duplicates: DuplicateMatch[] = [];

    normalizedLeads.forEach(({ lead, rowIndex }) => {
      const primaryContact = lead.contacts && lead.contacts[0];

      // Strategy 1: Email matching
      if (primaryContact && primaryContact.businessEmail) {
        const cleanEmail = primaryContact.businessEmail.toLowerCase().trim();
        const match = emailIndex.get(cleanEmail);
        if (match) {
          duplicates.push({
            row: rowIndex,
            matchedBy: 'email',
            existingLeadId: match.leadId,
            existingCompanyName: match.companyName,
            existingValue: cleanEmail,
          });
          return;
        }
      }

      // Strategy 2: Phone matching
      if (primaryContact && primaryContact.phone) {
        const cleanDigits = primaryContact.phone.replace(/[^0-9]/g, '');
        if (cleanDigits.length >= 7) {
          const match = phoneIndex.get(cleanDigits);
          if (match) {
            duplicates.push({
              row: rowIndex,
              matchedBy: 'phone',
              existingLeadId: match.leadId,
              existingCompanyName: match.companyName,
              existingValue: primaryContact.phone,
            });
            return;
          }
        }
      }

      // Strategy 3: LinkedIn URL matching
      if (primaryContact && primaryContact.linkedinProfile) {
        const cleanLinkedin = primaryContact.linkedinProfile.toLowerCase().trim();
        const match = linkedinIndex.get(cleanLinkedin);
        if (match) {
          duplicates.push({
            row: rowIndex,
            matchedBy: 'linkedin',
            existingLeadId: match.leadId,
            existingCompanyName: match.companyName,
            existingValue: cleanLinkedin,
          });
          return;
        }
      }

      // Strategy 4: Company Name + Contact Name matching (no email required)
      const companyVal = lead.companyName || '';
      const normCompany = companyVal.toLowerCase().trim();
      const compMatch = companyNameIndex.get(normCompany);
      if (compMatch) {
        if (primaryContact && primaryContact.name) {
          const normContact = primaryContact.name.toLowerCase().trim();
          if (compMatch.contacts.has(normContact)) {
            duplicates.push({
              row: rowIndex,
              matchedBy: 'company_and_name',
              existingLeadId: compMatch.leadId,
              existingCompanyName: compMatch.companyName,
              existingContactName: primaryContact.name,
              existingValue: `${companyVal} - ${primaryContact.name}`,
            });
            return;
          }
        }
      }
    });

    return duplicates;
  }

  /**
   * Preview pipeline: parses, validates, normalizes, and flags duplicates
   */
  async previewImport(orgId: string, buffer: Buffer): Promise<ImportPreviewResult> {
    const rawRows = this.parseFileBuffer(buffer);
    const errors: ImportError[] = [];
    const validPairs: Array<{ lead: CreateLeadInput; rowIndex: number }> = [];

    rawRows.forEach((row, idx) => {
      const rowIndex = idx + 2; // spreadsheet 1-indexed header offset
      const lead = this.validateAndNormalizeRow(row, rowIndex, errors);
      if (lead) {
        validPairs.push({ lead, rowIndex });
      }
    });

    const duplicates = await this.detectDuplicates(orgId, validPairs);
    const duplicateRowIndices = new Set(duplicates.map((d) => d.row));

    const finalValidLeads = validPairs
      .filter((p) => !duplicateRowIndices.has(p.rowIndex))
      .map((p) => p.lead);

    return {
      totalRows: rawRows.length,
      validRows: finalValidLeads.length,
      invalidRows: errors.length,
      duplicateRows: duplicates.length,
      errors,
      duplicates,
      normalizedLeads: validPairs.map((p) => p.lead),
    };
  }

  /**
   * Commits validated leads into the organization database
   */
  async confirmImport(
    orgId: string,
    leads: CreateLeadInput[],
    deduplicationStrategy: 'skip' | 'overwrite' | 'merge',
    userId?: string
  ): Promise<{ importedCount: number; leadIds: string[] }> {
    const importedIds: string[] = [];

    for (const input of leads) {
      const leadId = crypto.randomUUID();
      const lead: Lead = {
        id: leadId,
        organization_id: orgId,
        source_platform: input.sourcePlatform,
        original_post_url: input.originalPostUrl,
        discovery_date: input.discoveryDate || new Date().toISOString(),
        company_name: input.companyName,
        company_website: input.companyWebsite || null,
        industry: input.industry || null,
        company_size: input.companySize || null,
        location: input.location || null,
        requirement: input.requirement,
        intent_score: input.intentScore !== undefined ? input.intentScore : 50,
        qualification_status: input.qualificationStatus || 'REVIEW_PENDING',
        lead_status: 'DISCOVERED',
        ai_reasoning: 'Batch imported spreadsheet record.',
        is_simulated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.leadRepo.create(lead);
      importedIds.push(leadId);

      if (input.contacts && input.contacts.length > 0) {
        for (const c of input.contacts) {
          await db.contactRepo.create({
            id: crypto.randomUUID(),
            lead_id: leadId,
            name: c.name,
            business_email: c.businessEmail || null,
            phone: c.phone || null,
            job_title: c.jobTitle || null,
            linkedin_profile: c.linkedinProfile || null,
            is_verified: c.isVerified || false,
            created_at: new Date().toISOString(),
          });
        }
      }

      await db.scoreRepo.createOrUpdate({
        id: crypto.randomUUID(),
        lead_id: leadId,
        bant_budget_score: Math.max(0, lead.intent_score - 10),
        bant_authority_score: lead.intent_score,
        bant_need_score: Math.min(100, lead.intent_score + 5),
        bant_timeline_score: Math.max(0, lead.intent_score - 5),
        overall_intent_score: lead.intent_score,
        scoring_breakdown: { factors: ['Batch Import Record'] },
      });
    }

    // Record usage
    await db.usageRepo.record({
      id: crypto.randomUUID(),
      organization_id: orgId,
      metric: 'leads_discovered',
      quantity: importedIds.length,
      recorded_at: new Date().toISOString(),
    });

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'lead_imported',
      resourceType: 'leads',
      resourceId: `batch-${Date.now()}`,
      details: { importedCount: importedIds.length, strategy: deduplicationStrategy },
    });

    return {
      importedCount: importedIds.length,
      leadIds: importedIds,
    };
  }

  /**
   * Exports leads to CSV or Excel (.xlsx) buffer
   */
  async exportLeads(
    orgId: string,
    format: 'csv' | 'xlsx',
    filters: Record<string, unknown> = {},
    userId?: string
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    const { items: leads } = await db.leadRepo.query(orgId, { ...filters, limit: 5000 });

    if (userId) {
      await trackBulkOperation(orgId, userId, 'export', leads.length);
    }

    // Format tabular data
    const tableData = leads.map((l) => {
      const primaryContact = l.contacts && l.contacts[0];
      return {
        'ID': l.id,
        'Company Name': l.company_name,
        'Company Website': l.company_website || '',
        'Contact Name': primaryContact?.name || '',
        'Business Email': primaryContact?.business_email || '',
        'Phone Number': primaryContact?.phone || '',
        'Job Title': primaryContact?.job_title || '',
        'LinkedIn Profile': primaryContact?.linkedin_profile || '',
        'Industry': l.industry || '',
        'Company Size': l.company_size || '',
        'Location': l.location || '',
        'Requirement': l.requirement,
        'Source Platform': l.source_platform,
        'Original Requirement Post URL': l.original_post_url,
        'Intent Score': l.intent_score,
        'Qualification Status': l.qualification_status,
        'Lead Status': l.lead_status,
        'Discovery Date': l.discovery_date,
        'Data Origin': l.is_simulated ? 'SIMULATED DEMO SOURCE' : 'LIVE DISCOVERY',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    let buffer: Buffer;
    let fileName: string;
    let contentType: string;

    if (format === 'csv') {
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      buffer = Buffer.from(csvString, 'utf-8');
      fileName = `leads-export-${Date.now()}.csv`;
      contentType = 'text/csv';
    } else {
      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      buffer = Buffer.from(xlsxBuffer);
      fileName = `leads-export-${Date.now()}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'lead_exported',
      resourceType: 'leads',
      details: { recordCount: leads.length, format },
    });

    return { buffer, fileName, contentType };
  }
}

export const importExportService = new ImportExportService();

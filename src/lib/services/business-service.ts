import { BusinessProfileInput, ProductServiceInput, DocumentUploadInput } from '@/lib/schemas/business';
import { db } from '@/lib/db/repository';
import { BusinessProfile, ProductService, DocumentEntity } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export class BusinessService {
  /**
   * Retrieves business profile for organization
   */
  async getProfile(orgId: string): Promise<BusinessProfile | null> {
    return db.businessProfileRepo.findByOrg(orgId);
  }

  /**
   * Creates or updates organization business profile
   */
  async updateProfile(orgId: string, input: BusinessProfileInput, userId?: string): Promise<BusinessProfile> {
    const existing = await db.businessProfileRepo.findByOrg(orgId);
    const profile: BusinessProfile = {
      id: existing ? existing.id : crypto.randomUUID(),
      organization_id: orgId,
      website_url: input.websiteUrl,
      company_name: input.companyName,
      industry: input.industry || null,
      company_size: input.companySize || null,
      overview: input.overview || null,
      target_icp: input.targetIcp || {},
      ai_summary: input.aiSummary || null,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    const saved = await db.businessProfileRepo.createOrUpdate(profile);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'business_profile_updated',
      resourceType: 'business_profile',
      resourceId: saved.id,
      details: { companyName: saved.company_name, industry: saved.industry },
    });

    return saved;
  }

  /**
   * Products & Services Catalog
   */
  async listProducts(orgId: string): Promise<ProductService[]> {
    return db.productServiceRepo.findByOrg(orgId);
  }

  async addProduct(orgId: string, input: ProductServiceInput, userId?: string): Promise<ProductService> {
    const product: ProductService = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      name: input.name,
      category: input.category,
      description: input.description,
      value_proposition: input.valueProposition || null,
      faq_data: input.faqData || [],
      ai_suitability_status: input.aiSuitabilityStatus || 'PENDING_REVIEW',
      suitability_score: input.suitabilityScore !== undefined ? input.suitabilityScore : 0.90,
      created_at: new Date().toISOString(),
    };

    const created = await db.productServiceRepo.create(product);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'product_created',
      resourceType: 'product_service',
      resourceId: created.id,
      details: { name: created.name, category: created.category },
    });

    return created;
  }

  async updateProduct(
    id: string,
    orgId: string,
    input: Partial<ProductServiceInput>,
    userId?: string
  ): Promise<ProductService> {
    const existing = await db.productServiceRepo.findById(id);
    if (!existing || existing.organization_id !== orgId) {
      throw new AppError('Product or service not found', 'NOT_FOUND', 404);
    }

    const updated = await db.productServiceRepo.update(id, {
      ...input,
      value_proposition: input.valueProposition !== undefined ? input.valueProposition : existing.value_proposition,
      suitability_score: input.suitabilityScore !== undefined ? input.suitabilityScore : existing.suitability_score,
    });

    if (!updated) {
      throw new AppError('Failed to update product', 'INTERNAL_ERROR', 500);
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'product_updated',
      resourceType: 'product_service',
      resourceId: id,
      details: { name: updated.name },
    });

    return updated;
  }

  async deleteProduct(id: string, orgId: string, userId?: string): Promise<boolean> {
    const existing = await db.productServiceRepo.findById(id);
    if (!existing || existing.organization_id !== orgId) {
      throw new AppError('Product or service not found', 'NOT_FOUND', 404);
    }

    const success = await db.productServiceRepo.delete(id);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'product_deleted',
      resourceType: 'product_service',
      resourceId: id,
    });

    return success;
  }

  /**
   * Document Ingestion
   */
  async listDocuments(orgId: string): Promise<DocumentEntity[]> {
    return db.documentRepo.findByOrg(orgId);
  }

  async uploadDocument(orgId: string, input: DocumentUploadInput, userId?: string): Promise<DocumentEntity> {
    const doc: DocumentEntity = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      file_name: input.fileName,
      file_url: input.fileUrl,
      file_type: input.fileType,
      parsed_text: input.parsedText || `Parsed text representation for ${input.fileName}`,
      embedding: null,
      created_at: new Date().toISOString(),
    };

    const created = await db.documentRepo.create(doc);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'document_uploaded',
      resourceType: 'document',
      resourceId: created.id,
      details: { fileName: created.file_name, fileType: created.file_type },
    });

    return created;
  }

  async deleteDocument(id: string, orgId: string, userId?: string): Promise<boolean> {
    const existing = await db.documentRepo.findById(id);
    if (!existing || existing.organization_id !== orgId) {
      throw new AppError('Document not found', 'NOT_FOUND', 404);
    }

    const success = await db.documentRepo.delete(id);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'document_deleted',
      resourceType: 'document',
      resourceId: id,
    });

    return success;
  }
}

export const businessService = new BusinessService();

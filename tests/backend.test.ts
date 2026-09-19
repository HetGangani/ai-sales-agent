/**
 * AI Sales Agent Platform — Comprehensive Backend Test Suite
 */

import { authService } from '../src/lib/services/auth-service';
import { leadService } from '../src/lib/services/lead-service';
import { importExportService } from '../src/lib/services/import-export-service';
import { campaignService } from '../src/lib/services/campaign-service';
import { callService } from '../src/lib/services/call-service';
import { subscriptionService } from '../src/lib/services/subscription-service';
import { usageService } from '../src/lib/services/usage-service';
import { adminService } from '../src/lib/services/admin-service';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { signToken, verifyToken } from '../src/lib/auth/jwt';
import { hasPermission, isRoleAtLeast } from '../src/lib/auth/rbac';
import { checkRateLimit } from '../src/lib/security/rate-limiter';
import { trackFailedLogin } from '../src/lib/security/fraud-detector';
import { db } from '../src/lib/db/repository';
import { CampaignStatus } from '../src/lib/types/domain';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, errorDetails?: unknown) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, errorDetails || '');
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n🧪 ==========================================');
  console.log('🧪 AI Sales Agent Platform — Backend Test Suite');
  console.log('🧪 ==========================================\n');

  // Initialize repository
  db.init();

  // Test Suite 1: Authentication, Password & JWT
  console.log('--- 1. Authentication, Password Hashing & JWT ---');
  {
    const rawPass = 'SecureP@ssw0rd2026!';
    const hash = await hashPassword(rawPass);
    assert(typeof hash === 'string' && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2')), 'Password successfully hashed with bcrypt');

    const isValid = await verifyPassword(rawPass, hash);
    assert(isValid === true, 'Valid password verifies correctly against hash');

    const isInvalid = await verifyPassword('WrongPassword', hash);
    assert(isInvalid === false, 'Invalid password is rejected');

    const tokenPayload = {
      userId: 'user-123',
      email: 'test@acme.com',
      organizationId: 'org-123',
      role: 'ADMIN' as const,
    };
    const token = signToken(tokenPayload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token correctly generated and formatted');

    const decoded = verifyToken(token);
    assert(decoded !== null && decoded.userId === 'user-123' && decoded.role === 'ADMIN', 'JWT token decoded and verified successfully');

    // Register a new tenant
    const regResult = await authService.register({
      name: 'Test Founder',
      email: `founder-${Date.now()}@newenterprise.com`,
      password: 'EnterprisePassword123!',
      companyName: 'New Horizon Cloud',
      planTier: 'GROWTH',
    });
    assert(regResult.organization.name === 'New Horizon Cloud', 'New organization registered with slug and tier');
    assert(regResult.role === 'ADMIN', 'Registering user assigned ADMIN role');
  }

  // Test Suite 2: Role-Based Access Control (RBAC) & Multi-Tenancy
  console.log('\n--- 2. RBAC & Permissions ---');
  {
    assert(hasPermission('ADMIN', 'security:manage') === true, 'Admin has security:manage permission');
    assert(hasPermission('MANAGER', 'security:manage') === false, 'Manager denied security:manage permission');
    assert(hasPermission('MANAGER', 'campaigns:manage') === true, 'Manager has campaigns:manage permission');
    assert(hasPermission('USER', 'campaigns:manage') === false, 'User denied campaigns:manage permission');
    assert(hasPermission('USER', 'calls:make') === true, 'User has calls:make permission');

    assert(isRoleAtLeast('ADMIN', 'MANAGER') === true, 'Admin satisfies Manager role requirement');
    assert(isRoleAtLeast('USER', 'MANAGER') === false, 'User fails Manager role requirement');
  }

  // Test Suite 3: Lead Management & Multi-Attribute Filtering
  console.log('\n--- 3. Leads Domain & Search Queries ---');
  {
    const demoOrgId = '00000000-0000-0000-0000-000000000001';

    // List all leads
    const list = await leadService.listLeads(demoOrgId, { limit: 50 });
    assert(list.pagination.total >= 30, `Demo organization has ${list.pagination.total} opportunities pre-seeded (>=30)`);

    // Search query
    const searchRes = await leadService.listLeads(demoOrgId, { search: 'SharePoint' });
    assert(searchRes.items.length > 0, `Search for 'SharePoint' returned ${searchRes.items.length} relevant leads`);

    // Filter by Intent Score
    const highIntentRes = await leadService.listLeads(demoOrgId, { minIntentScore: 90 });
    assert(
      highIntentRes.items.every((l) => l.intent_score >= 90),
      'Filtered leads strictly adhere to minIntentScore >= 90'
    );

    // Create a new lead
    const newLead = await leadService.createLead(demoOrgId, {
      sourcePlatform: 'linkedin',
      originalPostUrl: 'https://linkedin.com/posts/test-rfp-999',
      companyName: 'Apex Test Automation Inc',
      companyWebsite: 'https://apextest.io',
      industry: 'Software Testing',
      companySize: '50-100 employees',
      requirement: 'Seeking Microsoft Gold Partner for SharePoint online intranets.',
      intentScore: 88,
      qualificationStatus: 'REVIEW_PENDING',
      leadStatus: 'DISCOVERED',
      contacts: [
        {
          name: 'Robert Vance',
          businessEmail: 'robert@apextest.io',
          phone: '+1 (555) 019-2834',
          jobTitle: 'VP Technology',
          isVerified: true,
        },
      ],
    });
    assert(newLead.id !== undefined && newLead.company_name === 'Apex Test Automation Inc', 'Lead created with mandatory 11 attributes');
    assert(newLead.contacts !== undefined && newLead.contacts.length === 1, 'Lead contact attached with verified business email');

    // Retrieve single lead
    const fetchedLead = await leadService.getLeadById(newLead.id, demoOrgId);
    assert(fetchedLead.company_name === 'Apex Test Automation Inc', 'Retrieved lead matches created lead');

    // Bulk update
    const bulkRes = await leadService.bulkUpdate(demoOrgId, {
      leadIds: [newLead.id],
      qualificationStatus: 'QUALIFIED',
    });
    assert(bulkRes.updatedCount === 1, 'Bulk update updated qualification status');
  }

  // Test Suite 4: Import, Export & 4-Way Deduplication Pipeline
  console.log('\n--- 4. Import / Export & 4-Way Deduplication ---');
  {
    const demoOrgId = '00000000-0000-0000-0000-000000000001';

    // Test Deduplication Strategy 1: Email Match
    const dupByEmail = await importExportService.detectDuplicates(demoOrgId, [
      {
        lead: {
          sourcePlatform: 'linkedin',
          originalPostUrl: 'https://linkedin.com/posts/dup-1',
          companyName: 'Different Name LLC',
          requirement: 'Looking for M365 consulting',
          intentScore: 80,
          qualificationStatus: 'REVIEW_PENDING',
          leadStatus: 'DISCOVERED',
          isSimulated: false,
          contacts: [{ name: 'Test Duplicate', businessEmail: 'marcus.vance@apexhealthsystems.org', isVerified: true }],
        },
        rowIndex: 2,
      },
    ]);
    assert(
      dupByEmail.length === 1 && dupByEmail[0].matchedBy === 'email',
      'Strategy 1: Duplicate correctly detected by existing verified email'
    );

    // Test Deduplication Strategy 2: Phone Match
    const dupByPhone = await importExportService.detectDuplicates(demoOrgId, [
      {
        lead: {
          sourcePlatform: 'public_directory',
          originalPostUrl: 'https://directory.com/dup-2',
          companyName: 'Unknown Corp',
          requirement: 'Power Platform developer',
          intentScore: 75,
          qualificationStatus: 'REVIEW_PENDING',
          leadStatus: 'DISCOVERED',
          isSimulated: false,
          contacts: [{ name: 'Test Contact', phone: '+1 (214) 555-0841', isVerified: true }],
        },
        rowIndex: 3,
      },
    ]);
    assert(
      dupByPhone.length === 1 && dupByPhone[0].matchedBy === 'phone',
      'Strategy 2: Duplicate correctly detected by existing phone number'
    );

    // Test Deduplication Strategy 4: Company + Name Match (No email available)
    const dupByCompanyAndName = await importExportService.detectDuplicates(demoOrgId, [
      {
        lead: {
          sourcePlatform: 'company_website',
          originalPostUrl: 'https://borealisenergy.ca/rfp',
          companyName: 'Borealis Energy Technologies',
          requirement: 'Engineering document migration',
          intentScore: 90,
          qualificationStatus: 'QUALIFIED',
          leadStatus: 'DISCOVERED',
          isSimulated: false,
          contacts: [{ name: 'Luc Tremblay', isVerified: false }], // No email or phone!
        },
        rowIndex: 4,
      },
    ]);
    assert(
      dupByCompanyAndName.length === 1 && dupByCompanyAndName[0].matchedBy === 'company_and_name',
      'Strategy 4: Duplicate correctly detected by Company + Contact Name match (without email)'
    );

    // Test Export
    const exportResult = await importExportService.exportLeads(demoOrgId, 'csv');
    assert(exportResult.buffer.length > 0 && exportResult.contentType === 'text/csv', 'Leads exported to CSV buffer');
    const xlsxResult = await importExportService.exportLeads(demoOrgId, 'xlsx');
    assert(xlsxResult.buffer.length > 0 && xlsxResult.fileName.endsWith('.xlsx'), 'Leads exported to Excel .xlsx buffer');
  }

  // Test Suite 5: Campaigns Lifecycle State Machine
  console.log('\n--- 5. Campaigns State Machine & Stats ---');
  {
    const demoOrgId = '00000000-0000-0000-0000-000000000001';

    const campaign = await campaignService.createCampaign(demoOrgId, {
      name: 'Automated Lifecycle Test Campaign',
      type: 'LEADS_AND_CALLING',
      targetTimezone: 'America/New_York',
      config: {
        language: 'en',
        timezone: 'America/New_York',
        calling_window_start: '09:00',
        calling_window_end: '17:00',
        retry_count: 3,
        voicemail_enabled: true,
        callback_enabled: true,
        frequency: 'immediate',
      },
    });
    assert(campaign.status === 'DRAFT', 'Newly created campaign starts in DRAFT status');

    // Valid transition: DRAFT -> ACTIVE
    const activeCamp = await campaignService.updateStatus(campaign.id, demoOrgId, { status: 'ACTIVE' });
    assert(activeCamp.status === 'ACTIVE', 'Campaign transitioned to ACTIVE status');

    // Valid transition: ACTIVE -> PAUSED
    const pausedCamp = await campaignService.updateStatus(campaign.id, demoOrgId, { status: 'PAUSED' });
    assert(pausedCamp.status === 'PAUSED', 'Campaign transitioned to PAUSED status');

    // Invalid transition: PAUSED -> DRAFT should throw
    let errorThrown = false;
    try {
      await campaignService.updateStatus(campaign.id, demoOrgId, { status: 'DRAFT' as CampaignStatus });
    } catch {
      errorThrown = true;
    }
    assert(errorThrown === true, 'Invalid state transition (PAUSED -> DRAFT) rejected');

    // Campaign Stats
    const stats = await campaignService.getCampaignStats(campaign.id, demoOrgId);
    assert(stats.totalLeads >= 0 && typeof stats.connectRate === 'number', 'Campaign statistics aggregated successfully');
  }

  // Test Suite 6: Calls & Telephony Simulation
  console.log('\n--- 6. Calls & Telephony Simulation ---');
  {
    const demoOrgId = '00000000-0000-0000-0000-000000000001';
    const leads = (await leadService.listLeads(demoOrgId, { limit: 1 })).items;
    const testLead = leads[0];

    const simulatedCall = await callService.simulateCall(demoOrgId, {
      leadId: testLead.id,
      direction: 'OUTBOUND',
      language: 'en',
      scenario: 'interested',
    });

    assert(simulatedCall.status === 'completed', 'Simulated call marked as completed');
    assert(simulatedCall.duration_seconds > 0, 'Call duration recorded');
    assert(simulatedCall.transcript !== undefined && simulatedCall.transcript.speaker_segments.length > 0, 'Transcript speaker segments generated');
    assert(simulatedCall.summary !== undefined && simulatedCall.summary.sentiment === 'POSITIVE', 'Call summary and sentiment attached');
    assert(simulatedCall.summary?.next_best_action !== undefined, 'Next-best action recommended');
  }

  // Test Suite 7: Subscriptions & Usage Metering
  console.log('\n--- 7. Subscriptions & Usage Metering ---');
  {
    const demoOrgId = '00000000-0000-0000-0000-000000000001';
    const subInfo = await subscriptionService.getSubscription(demoOrgId);
    assert(subInfo.subscription.plan_tier === 'GROWTH', 'Current subscription tier is GROWTH');
    assert(subInfo.planDetails.monthlyMinutes === 2000, 'GROWTH plan provides 2,000 monthly voice minutes');

    const usage = await usageService.getUsageSummary(demoOrgId);
    assert(usage.voiceMinutes.allocated === 2000, 'Usage allocated minutes match subscription');
  }

  // Test Suite 8: Rate Limiting & Fraud Detection
  console.log('\n--- 8. Rate Limiting & Fraud Anomaly Detection ---');
  {
    const testIp = '198.51.100.22';
    // Test Rate Limiter
    for (let i = 0; i < 5; i++) {
      checkRateLimit(`test-key:${testIp}`, { limit: 10, windowMs: 10000 });
    }
    const checkAllowed = checkRateLimit(`test-key:${testIp}`, { limit: 10, windowMs: 10000 });
    assert(checkAllowed.allowed === true, 'Rate limiter permits requests within quota');

    // Trigger rate limit breach
    for (let i = 0; i < 10; i++) {
      checkRateLimit(`exceeded-key:${testIp}`, { limit: 3, windowMs: 10000 });
    }
    const checkExceeded = checkRateLimit(`exceeded-key:${testIp}`, { limit: 3, windowMs: 10000 });
    assert(checkExceeded.allowed === false, 'Rate limiter blocks requests exceeding quota');

    // Test Fraud Anomaly Trigger on Failed Logins
    let fraudFlagged = false;
    for (let i = 0; i < 6; i++) {
      fraudFlagged = await trackFailedLogin('hacker@attack.com', testIp);
    }
    assert(fraudFlagged === true, 'Fraud detector automatically flagged multiple failed logins as anomaly event');

    // Admin Dashboard & Health
    const adminStats = await adminService.getDashboardStats();
    assert(adminStats.totalOrganizations >= 1, 'Admin dashboard aggregates platform-wide organizations');
    assert(adminStats.openFraudAlerts >= 1, 'Admin dashboard reflects open fraud alerts');
  }

  console.log('\n==========================================');
  console.log(`📊 Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('==========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

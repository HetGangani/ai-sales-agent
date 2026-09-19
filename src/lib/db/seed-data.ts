import {
  Organization,
  User,
  Membership,
  BusinessProfile,
  ProductService,
  Lead,
  LeadContact,
  LeadScore,
  MarketSignal,
  Campaign,
  CampaignLead,
  Call,
  CallTranscript,
  CallSummary,
  Subscription,
  UsageRecord,
  LeadSource,
  Notification,
  AuditLog,
  FraudEvent,
} from '@/lib/types/domain';

// Fixed IDs for reliable tests and relational integrity
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000002';
export const DEMO_MANAGER_ID = '00000000-0000-0000-0000-000000000003';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000004';
export const DEMO_CAMPAIGN_1_ID = '00000000-0000-0000-0000-000000000010';
export const DEMO_CAMPAIGN_2_ID = '00000000-0000-0000-0000-000000000011';

// 1. Demo Organization
export const seedOrganization: Organization = {
  id: DEMO_ORG_ID,
  name: 'Acme Technologies',
  slug: 'acme-tech',
  plan_tier: 'GROWTH',
  created_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-09-19T10:00:00Z',
};

// 2. Demo Users (Hashed password for "Password123!" using bcrypt standard format)
// $2a$10$wT8m9WfT41jK6U0pT5o56eLhT5d2B4/8zE7p2qZ5yvXh0A6V9rB/e
export const seedUsers: User[] = [
  {
    id: DEMO_ADMIN_ID,
    email: 'admin@acmetech.com',
    name: 'Sarah Jenkins',
    password_hash: '$2a$10$u7l0Ea9tL51P4fL08uD5g.5H6c41b8f.67GZzQp0eN2E6N2Q8z9uK',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    is_super_admin: false,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: DEMO_MANAGER_ID,
    email: 'manager@acmetech.com',
    name: 'David Zhao',
    password_hash: '$2a$10$u7l0Ea9tL51P4fL08uD5g.5H6c41b8f.67GZzQp0eN2E6N2Q8z9uK',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    is_super_admin: false,
    created_at: '2026-09-02T09:00:00Z',
  },
  {
    id: DEMO_USER_ID,
    email: 'user@acmetech.com',
    name: 'Elena Rostova',
    password_hash: '$2a$10$u7l0Ea9tL51P4fL08uD5g.5H6c41b8f.67GZzQp0eN2E6N2Q8z9uK',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_super_admin: false,
    created_at: '2026-09-03T10:00:00Z',
  },
];

// 3. Demo Memberships
export const seedMemberships: Membership[] = [
  {
    id: '00000000-0000-0000-0000-000000000021',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    role: 'ADMIN',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000022',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_MANAGER_ID,
    role: 'MANAGER',
    created_at: '2026-09-02T09:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000023',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_USER_ID,
    role: 'USER',
    created_at: '2026-09-03T10:00:00Z',
  },
];

// 4. Demo Business Profile
export const seedBusinessProfile: BusinessProfile = {
  id: '00000000-0000-0000-0000-000000000030',
  organization_id: DEMO_ORG_ID,
  website_url: 'https://acmetech.com',
  company_name: 'Acme Technologies',
  industry: 'IT Services & Cloud Consulting',
  company_size: '50-200 employees',
  overview:
    'Acme Technologies is a premier Microsoft Cloud Solutions Partner specializing in enterprise Microsoft 365 migrations, modern SharePoint intranets, Power Platform workflow automation, and custom cloud-native business applications.',
  target_icp: {
    targetIndustries: ['Healthcare', 'Financial Services', 'Manufacturing', 'Legal', 'Logistics'],
    companySizeRange: '50-2000 employees',
    targetRoles: ['Chief Information Officer (CIO)', 'VP of IT', 'IT Director', 'Digital Transformation Lead', 'COO'],
    geography: ['North America', 'United Kingdom', 'Western Europe', 'Australia'],
    keyPainPoints: [
      'Legacy on-premise SharePoint / Exchange maintenance costs',
      'Manual paper-based approval workflows',
      'Fragmented document security and compliance exposure',
      'Outdated monolithic business software',
    ],
  },
  ai_summary:
    'High-competency Microsoft partner delivering fixed-scope and managed cloud transformation services. Strengths include zero-downtime migrations, automated compliance governance, and rapid Power Platform deployment.',
  created_at: '2026-09-01T08:30:00Z',
};

// 5. Demo Products & Services (4 Core Offerings)
export const seedProductsServices: ProductService[] = [
  {
    id: '00000000-0000-0000-0000-000000000041',
    organization_id: DEMO_ORG_ID,
    name: 'Microsoft 365 Cloud Migration & Modern Workplace',
    category: 'Microsoft 365',
    description:
      'Turnkey enterprise migration from legacy on-premise Exchange, file servers, or Google Workspace to Microsoft 365 E3/E5 with security baseline configuration and change management.',
    value_proposition: 'Eliminate 60% of on-premise server maintenance while securing corporate data under Microsoft Entra ID and Purview.',
    faq_data: [
      {
        question: 'How do you handle zero-downtime mailbox migration?',
        answer: 'We utilize hybrid staged cutover tooling that synchronizes mail in the background without interrupting business operations.',
      },
      {
        question: 'Are compliance frameworks supported?',
        answer: 'Yes, we pre-configure Microsoft Purview DLP and retention policies for HIPAA, GDPR, and SOC2 compliance.',
      },
    ],
    ai_suitability_status: 'APPROVED',
    suitability_score: 0.98,
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000042',
    organization_id: DEMO_ORG_ID,
    name: 'SharePoint Online Intranet & Document Governance',
    category: 'SharePoint',
    description:
      'Custom SharePoint Online portals, enterprise search restructuring, document lifecycle management, and migration from SharePoint 2013/2016/2019 servers.',
    value_proposition: 'Transform static document repositories into an intelligent, searchable digital employee workplace.',
    faq_data: [
      {
        question: 'Can you migrate custom SharePoint on-prem workflows?',
        answer: 'We re-architect legacy SharePoint Designer workflows into modern Power Automate cloud flows.',
      },
    ],
    ai_suitability_status: 'APPROVED',
    suitability_score: 0.96,
    created_at: '2026-09-01T09:15:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000043',
    organization_id: DEMO_ORG_ID,
    name: 'Power Platform Workflow & Business Process Automation',
    category: 'Power Platform',
    description:
      'Design and deployment of custom Power Apps (Canvas & Model-Driven), Power Automate robotic process automation (RPA), and executive Power BI dashboards.',
    value_proposition: 'Automate manual business approvals and reduce data entry cycle times by 80%.',
    faq_data: [
      {
        question: 'Can Power Apps connect to legacy ERPs?',
        answer: 'Yes, via custom REST connectors or on-premises data gateways.',
      },
    ],
    ai_suitability_status: 'APPROVED',
    suitability_score: 0.94,
    created_at: '2026-09-01T09:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000044',
    organization_id: DEMO_ORG_ID,
    name: 'Custom Enterprise Web & Cloud Application Engineering',
    category: 'Custom Business Applications',
    description:
      'Full-stack custom web application modernization, Azure cloud architecture, microservices re-engineering, and bespoke customer portals.',
    value_proposition: 'Scalable, secure modern web applications tailored specifically to unique operational processes.',
    faq_data: [
      {
        question: 'What technology stack do you build on?',
        answer: 'Modern Next.js, Node.js, TypeScript, PostgreSQL, and Azure Cloud infrastructure.',
      },
    ],
    ai_suitability_status: 'APPROVED',
    suitability_score: 0.92,
    created_at: '2026-09-01T09:45:00Z',
  },
];

// 6. Demo Lead Sources
export const seedLeadSources: LeadSource[] = [
  {
    id: '00000000-0000-0000-0000-000000000051',
    organization_id: DEMO_ORG_ID,
    platform_id: 'linkedin',
    name: 'LinkedIn RFP & Executive Signals',
    is_active: true,
    is_simulated: true,
    config: { keywords: ['SharePoint migration', 'Microsoft 365 consultant', 'Power Platform developer'] },
    last_synced_at: '2026-09-19T18:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000052',
    organization_id: DEMO_ORG_ID,
    platform_id: 'company_website',
    name: 'Enterprise Careers & RFP Portals',
    is_active: true,
    is_simulated: true,
    config: { domains: ['healthcare-portal.org', 'fintech-solutions.io'] },
    last_synced_at: '2026-09-19T17:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000053',
    organization_id: DEMO_ORG_ID,
    platform_id: 'job_platform',
    name: 'Tech Job Openings & Hiring Surges',
    is_active: true,
    is_simulated: true,
    config: { titles: ['SharePoint Architect', 'PowerApps Engineer', 'Cloud Migration Specialist'] },
    last_synced_at: '2026-09-19T16:45:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000054',
    organization_id: DEMO_ORG_ID,
    platform_id: 'public_directory',
    name: 'B2B Vendor & Project Directories',
    is_active: true,
    is_simulated: true,
    config: { sources: ['Clutch', 'G2', 'Crunchbase'] },
    last_synced_at: '2026-09-19T15:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000055',
    organization_id: DEMO_ORG_ID,
    platform_id: 'crm',
    name: 'HubSpot & Inbound Leads Sync',
    is_active: true,
    is_simulated: true,
    config: { provider: 'hubspot', autoEnrich: true },
    last_synced_at: '2026-09-19T14:20:00Z',
  },
];

// Helper to generate 30 opportunities with all required fields
function generateSeedOpportunities(): {
  leads: Lead[];
  contacts: LeadContact[];
  scores: LeadScore[];
  signals: MarketSignal[];
} {
  const rawData = [
    {
      source: 'linkedin' as const,
      company: 'Apex Health Systems',
      website: 'https://apexhealthsystems.org',
      location: 'Chicago, IL, USA',
      industry: 'Healthcare & Life Sciences',
      size: '500-1000 employees',
      requirement: 'Seeking Microsoft certified partner to migrate 1,800 mailboxes and 400 on-prem SharePoint 2013 sites to Microsoft 365 E5 with HIPAA compliance governance.',
      intent: 95,
      qual: 'QUALIFIED' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Dr. Marcus Vance',
        email: 'marcus.vance@apexhealthsystems.org',
        phone: '+1 (312) 555-0192',
        title: 'Chief Information Officer',
        linkedin: 'https://linkedin.com/in/marcus-vance-cio',
      },
      bant: { budget: 90, auth: 95, need: 98, timeline: 92 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Published RFP on LinkedIn for M365 migration', confidence: 0.96 },
        { type: 'relevant_hiring' as const, title: 'Hiring Director of Cloud Infrastructure', confidence: 0.88 },
        { type: 'decision_maker_identified' as const, title: 'CIO active on cloud modernization forums', confidence: 0.94 },
      ],
    },
    {
      source: 'linkedin' as const,
      company: 'Vanguard Logistics Corp',
      website: 'https://vanguardlogistics.com',
      location: 'Dallas, TX, USA',
      industry: 'Logistics & Supply Chain',
      size: '1000-5000 employees',
      requirement: 'Need urgent Power Automate & Power Apps development to replace paper freight manifest approvals across 22 regional distribution hubs.',
      intent: 92,
      qual: 'QUALIFIED' as const,
      status: 'ENRICHED' as const,
      contact: {
        name: 'Karen Mitchell',
        email: 'k.mitchell@vanguardlogistics.com',
        phone: '+1 (214) 555-0841',
        title: 'VP of Digital Operations',
        linkedin: 'https://linkedin.com/in/karen-mitchell-vanguard',
      },
      bant: { budget: 88, auth: 92, need: 95, timeline: 90 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Posted LinkedIn query seeking Power Platform consultant', confidence: 0.95 },
        { type: 'technology_stack' as const, title: 'Currently running legacy SAP with manual Excel routing', confidence: 0.91 },
      ],
    },
    {
      source: 'job_platform' as const,
      company: 'Meridian Capital Partners',
      website: 'https://meridiancap.com',
      location: 'New York, NY, USA',
      industry: 'Financial Services & Private Equity',
      size: '100-250 employees',
      requirement: 'Open job position for SharePoint Intranet Administrator indicates planned overhaul of deal room collaboration portals and SEC-compliant document retention.',
      intent: 88,
      qual: 'QUALIFIED' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Jonathan Reynolds',
        email: 'jreynolds@meridiancap.com',
        phone: '+1 (212) 555-0144',
        title: 'Managing Director & CTO',
        linkedin: 'https://linkedin.com/in/jreynolds-fintech',
      },
      bant: { budget: 92, auth: 90, need: 86, timeline: 84 },
      signals: [
        { type: 'relevant_hiring' as const, title: 'Posting for 2 Senior SharePoint Engineers on Indeed', confidence: 0.92 },
        { type: 'company_activity' as const, title: 'Announced expansion of London private wealth arm', confidence: 0.85 },
      ],
    },
    {
      source: 'company_website' as const,
      company: 'Borealis Energy Technologies',
      website: 'https://borealisenergy.ca',
      location: 'Calgary, AB, Canada',
      industry: 'Energy & Utilities',
      size: '250-500 employees',
      requirement: 'Public vendor invitation posted on corporate website RFP page for engineering document management system migration to Azure Cloud and SharePoint Online.',
      intent: 90,
      qual: 'QUALIFIED' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Luc Tremblay',
        email: 'ltremblay@borealisenergy.ca',
        phone: '+1 (403) 555-0177',
        title: 'Head of IT & Field Technology',
        linkedin: 'https://linkedin.com/in/luc-tremblay-energy',
      },
      bant: { budget: 85, auth: 90, need: 94, timeline: 88 },
      signals: [
        { type: 'requirement_posted' as const, title: 'RFP published on vendor procurement portal', confidence: 0.98 },
      ],
    },
    {
      source: 'public_directory' as const,
      company: 'Sterling Legal LLP',
      website: 'https://sterlinglegal.co.uk',
      location: 'London, UK',
      industry: 'Legal Services',
      size: '50-100 employees',
      requirement: 'Clutch inquiry seeking Microsoft 365 security hardening, sensitive client matter DLP enforcement, and Power BI operational billing analytics.',
      intent: 84,
      qual: 'REVIEW_PENDING' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Gemma Davies',
        email: 'gemma.davies@sterlinglegal.co.uk',
        phone: '+44 20 7946 0912',
        title: 'Chief Operating Officer',
        linkedin: 'https://linkedin.com/in/gemma-davies-legal',
      },
      bant: { budget: 80, auth: 88, need: 84, timeline: 82 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Verified Clutch advisory search query', confidence: 0.90 },
      ],
    },
    {
      source: 'crm' as const,
      company: 'OmniTrade Retail Group',
      website: 'https://omnitraderetail.com',
      location: 'Atlanta, GA, USA',
      industry: 'Retail & Consumer Goods',
      size: '500-1000 employees',
      requirement: 'Inbound demo request submitted: Need custom React/Node supplier inventory portal integrated with Azure SQL backend to connect 140 third-party vendors.',
      intent: 96,
      qual: 'QUALIFIED' as const,
      status: 'ENGAGED' as const,
      contact: {
        name: 'Derrick Hall',
        email: 'dhall@omnitraderetail.com',
        phone: '+1 (404) 555-0319',
        title: 'Director of Enterprise Applications',
        linkedin: 'https://linkedin.com/in/derrick-hall-retail',
      },
      bant: { budget: 95, auth: 94, need: 98, timeline: 96 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Inbound high-priority contact form submitted', confidence: 0.99 },
        { type: 'company_activity' as const, title: 'Opening 15 new superstores in Q1', confidence: 0.90 },
      ],
    },
    {
      source: 'x' as const,
      company: 'Strata FinTech Solutions',
      website: 'https://stratafintech.io',
      location: 'San Francisco, CA, USA',
      industry: 'Financial Technology',
      size: '20-50 employees',
      requirement: 'CTO tweeted: Looking for elite dev shop to build custom SOC2-compliant customer onboarding dashboard on Next.js with Azure Entra B2C authentication.',
      intent: 86,
      qual: 'REVIEW_PENDING' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Arjun Mehta',
        email: 'arjun@stratafintech.io',
        phone: '+1 (415) 555-0182',
        title: 'Co-Founder & CTO',
        linkedin: 'https://linkedin.com/in/arjunmehta-fintech',
      },
      bant: { budget: 82, auth: 98, need: 90, timeline: 80 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Public tweet with commercial RFP intent', confidence: 0.93 },
      ],
    },
    {
      source: 'job_platform' as const,
      company: 'Novus Biopharma',
      website: 'https://novusbio.com',
      location: 'Boston, MA, USA',
      industry: 'Pharmaceuticals',
      size: '250-500 employees',
      requirement: 'Job posting for Microsoft 365 Cloud Compliance Lead. Looking to deploy Purview information protection and automated clinical trial workflows.',
      intent: 82,
      qual: 'REVIEW_PENDING' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Rachel Adams',
        email: 'radams@novusbio.com',
        phone: '+1 (617) 555-0164',
        title: 'VP of Quality & Regulatory IT',
        linkedin: 'https://linkedin.com/in/rachel-adams-pharma',
      },
      bant: { budget: 85, auth: 80, need: 84, timeline: 78 },
      signals: [
        { type: 'relevant_hiring' as const, title: 'Active LinkedIn Job listing for M365 Architect', confidence: 0.89 },
      ],
    },
    {
      source: 'freelance_platform' as const,
      company: 'Precision Industrial Automation',
      website: 'https://precisionind.com',
      location: 'Detroit, MI, USA',
      industry: 'Manufacturing',
      size: '100-250 employees',
      requirement: 'Upwork enterprise job: Need dedicated team to build Power Apps maintenance inspection app for shop floor tablets with offline sync.',
      intent: 89,
      qual: 'QUALIFIED' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Kurt Schneider',
        email: 'kschneider@precisionind.com',
        phone: '+1 (313) 555-0198',
        title: 'Plant Operations Director',
        linkedin: 'https://linkedin.com/in/kurt-schneider-mfg',
      },
      bant: { budget: 86, auth: 90, need: 92, timeline: 88 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Upwork Enterprise Verified Client Job Post', confidence: 0.94 },
      ],
    },
    {
      source: 'public_directory' as const,
      company: 'Beacon Education Trust',
      website: 'https://beaconeducation.org.uk',
      location: 'Manchester, UK',
      industry: 'Education & Non-Profit',
      size: '500-1000 employees',
      requirement: 'Public tender listed on UK Contracts Finder: Consolidation of 12 academy schools onto unified Microsoft 365 tenant and SharePoint staff intranet.',
      intent: 91,
      qual: 'QUALIFIED' as const,
      status: 'DISCOVERED' as const,
      contact: {
        name: 'Ian Fletcher',
        email: 'i.fletcher@beaconeducation.org.uk',
        phone: '+44 161 555 0122',
        title: 'Director of Technology & Systems',
        linkedin: 'https://linkedin.com/in/ian-fletcher-education',
      },
      bant: { budget: 90, auth: 92, need: 94, timeline: 86 },
      signals: [
        { type: 'requirement_posted' as const, title: 'Official UK public sector tender documentation', confidence: 0.99 },
      ],
    },
  ];

  // Extend with 20 more realistic leads to reach ~30 total opportunities
  const industries = ['Financial Services', 'Healthcare', 'Manufacturing', 'Technology', 'Logistics', 'Retail', 'Legal', 'Construction'];
  const locations = ['Austin, TX, USA', 'Seattle, WA, USA', 'Toronto, ON, Canada', 'Sydney, Australia', 'Frankfurt, Germany', 'Denver, CO, USA', 'Phoenix, AZ, USA'];
  const sourceList: Array<'linkedin' | 'company_website' | 'job_platform' | 'public_directory' | 'crm'> = [
    'linkedin',
    'company_website',
    'job_platform',
    'public_directory',
    'crm',
  ];

  const extendedCompanies = [
    { name: 'Crestview Wealth Advisory', req: 'Migrating 80 financial planners to Microsoft 365 Business Premium with Intune device management.', intent: 87 },
    { name: 'AeroTech Systems Inc', req: 'SharePoint on-premise 2016 migration to SharePoint Online with CMMC compliance.', intent: 93 },
    { name: 'BlueWater Maritime Shipping', req: 'Power Automate workflow solution for international customs clearance document handling.', intent: 85 },
    { name: 'Highland Care Partners', req: 'HIPAA-compliant document management portal and clinical team SharePoint hub.', intent: 91 },
    { name: 'Trident Manufacturing Group', req: 'Custom Power BI executive analytics dashboard connecting Oracle ERP and IoT sensors.', intent: 84 },
    { name: 'Synthex Life Sciences', req: 'Microsoft Purview sensitive document classification and DLP deployment for R&D data.', intent: 89 },
    { name: 'Civic Trust Insurance', req: 'Legacy claims portal modernization into modern React & Azure Cloud architecture.', intent: 94 },
    { name: 'Silverstone Logistics', req: 'Automated warehouse dispatch notifications and Power Apps mobile driver sign-off.', intent: 86 },
    { name: 'Kodiak Mining & Resources', req: 'Remote camp connectivity with offline-capable SharePoint document caches.', intent: 79 },
    { name: 'Integra Media Networks', req: 'Digital asset management portal built on SharePoint Online and Azure Media Services.', intent: 83 },
    { name: 'Summit Horizon Capital', req: 'Microsoft Teams Phone System and voice routing rollout for 350 investment bankers.', intent: 88 },
    { name: 'Nexus Renewable Energy', req: 'Power Apps asset inspection system for wind turbine technician field teams.', intent: 90 },
    { name: 'Vanguard Aerospace LLC', req: 'ITAR-compliant Microsoft 365 GCC High migration and tenant configuration.', intent: 96 },
    { name: 'Urban Grid Real Estate', req: 'Tenant lease document automation with Power Automate and DocuSign connector.', intent: 81 },
    { name: 'Solaria Semiconductor', req: 'Cleanroom inventory tracking custom web portal on Node.js and Azure SQL.', intent: 87 },
    { name: 'First National Underwriters', req: 'SharePoint intranet redesign and automated policy approval flow re-architecture.', intent: 85 },
    { name: 'Zenith Health Diagnostics', req: 'Laboratory specimen tracking mobile app developed on Microsoft Power Platform.', intent: 92 },
    { name: 'Orion Global Supply', req: 'Consolidation of 5 global Microsoft 365 tenants into unified corporate enterprise tenant.', intent: 95 },
    { name: 'Cascade Brewery Works', req: 'B2B wholesale customer ordering portal on Next.js and Microsoft Power Platform.', intent: 82 },
    { name: 'Pinnacle Law Advocates', req: 'Matter file archiving and automated Microsoft 365 retention policy governance.', intent: 84 },
  ];

  const leads: Lead[] = [];
  const contacts: LeadContact[] = [];
  const scores: LeadScore[] = [];
  const signals: MarketSignal[] = [];

  // Add 10 detailed leads
  rawData.forEach((item, index) => {
    const leadId = `00000000-0000-0000-0000-00000000010${index}`;
    const lead: Lead = {
      id: leadId,
      organization_id: DEMO_ORG_ID,
      source_platform: item.source,
      original_post_url: `https://${item.source}.com/posts/rfp-${index + 1001}`,
      discovery_date: new Date(Date.now() - (index + 1) * 3600000 * 6).toISOString(),
      company_name: item.company,
      company_website: item.website,
      industry: item.industry,
      company_size: item.size,
      location: item.location,
      requirement: item.requirement,
      intent_score: item.intent,
      qualification_status: item.qual,
      lead_status: item.status,
      ai_reasoning: `Strong alignment with Acme Technologies ${item.requirement.includes('SharePoint') ? 'SharePoint' : item.requirement.includes('Power') ? 'Power Platform' : 'Microsoft 365'} capabilities. Decision maker identified with clear timeline and budget allocation.`,
      is_simulated: true,
      created_at: new Date(Date.now() - (index + 1) * 3600000 * 6).toISOString(),
    };
    leads.push(lead);

    const contact: LeadContact = {
      id: `00000000-0000-0000-0000-00000000020${index}`,
      lead_id: leadId,
      name: item.contact.name,
      business_email: item.contact.email,
      phone: item.contact.phone,
      job_title: item.contact.title,
      linkedin_profile: item.contact.linkedin,
      is_verified: true,
      created_at: lead.created_at,
    };
    contacts.push(contact);

    const score: LeadScore = {
      id: `00000000-0000-0000-0000-00000000030${index}`,
      lead_id: leadId,
      bant_budget_score: item.bant.budget,
      bant_authority_score: item.bant.auth,
      bant_need_score: item.bant.need,
      bant_timeline_score: item.bant.timeline,
      overall_intent_score: item.intent,
      scoring_breakdown: {
        budget_rationale: 'Active budget confirmed via public procurement / verified funding allocation.',
        authority_rationale: 'Identified C-Level or VP decision maker with direct purchasing authority.',
        need_rationale: 'Explicit commercial pain point addressing legacy infrastructure degradation.',
        timeline_rationale: 'Immediate project kickoff targeted within current operational fiscal quarter.',
        factors: ['High Authority Match', 'Active RFP', 'Direct Cloud Fit', 'Verified Email'],
      },
    };
    scores.push(score);

    item.signals.forEach((s, sIdx) => {
      signals.push({
        id: `00000000-0000-0000-0000-00000000${index}40${sIdx}`,
        lead_id: leadId,
        signal_type: s.type,
        title: s.title,
        description: `Verified signal indicating commercial buying intent for Acme Technologies services.`,
        source_url: `https://signals.market-intel.com/event/${index}-${sIdx}`,
        confidence: s.confidence,
        created_at: lead.created_at,
      });
    });
  });

  // Add 20 extended leads
  extendedCompanies.forEach((item, index) => {
    const leadIdx = index + 10;
    const leadId = `00000000-0000-0000-0000-0000000001${leadIdx < 100 ? leadIdx : '99'}`;
    const src = sourceList[index % sourceList.length];
    const ind = industries[index % industries.length];
    const loc = locations[index % locations.length];

    const lead: Lead = {
      id: leadId,
      organization_id: DEMO_ORG_ID,
      source_platform: src,
      original_post_url: `https://${src}.com/requirements/opp-${2000 + index}`,
      discovery_date: new Date(Date.now() - (leadIdx * 4) * 3600000).toISOString(),
      company_name: item.name,
      company_website: `https://${item.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      industry: ind,
      company_size: '100-500 employees',
      location: loc,
      requirement: item.req,
      intent_score: item.intent,
      qualification_status: item.intent >= 90 ? 'QUALIFIED' : 'REVIEW_PENDING',
      lead_status: 'DISCOVERED',
      ai_reasoning: `Matches Acme Technologies target profile in ${ind}. Intent score ${item.intent}% computed based on observable hiring, technology stack, and public procurement posts.`,
      is_simulated: true,
      created_at: new Date(Date.now() - (leadIdx * 4) * 3600000).toISOString(),
    };
    leads.push(lead);

    const contact: LeadContact = {
      id: `00000000-0000-0000-0000-0000000002${leadIdx < 100 ? leadIdx : '99'}`,
      lead_id: leadId,
      name: `Executive Contact ${leadIdx}`,
      business_email: `contact@${item.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+1 (555) 010-${1000 + index}`,
      job_title: 'IT Director / Digital Lead',
      linkedin_profile: `https://linkedin.com/in/exec-${leadIdx}`,
      is_verified: true,
      created_at: lead.created_at,
    };
    contacts.push(contact);

    const score: LeadScore = {
      id: `00000000-0000-0000-0000-0000000003${leadIdx < 100 ? leadIdx : '99'}`,
      lead_id: leadId,
      bant_budget_score: item.intent - 5,
      bant_authority_score: item.intent,
      bant_need_score: item.intent + 2 > 100 ? 100 : item.intent + 2,
      bant_timeline_score: item.intent - 8,
      overall_intent_score: item.intent,
      scoring_breakdown: {
        budget_rationale: 'Standard commercial budget estimated for mid-market cloud project.',
        authority_rationale: 'Direct department head contact identified.',
        need_rationale: 'Clear technical requirements documented in public listing.',
        timeline_rationale: 'Target deployment within 60-90 days.',
      },
    };
    scores.push(score);

    signals.push({
      id: `00000000-0000-0000-0000-0000000004${leadIdx < 100 ? leadIdx : '99'}`,
      lead_id: leadId,
      signal_type: 'requirement_posted',
      title: `Public commercial requirement detected on ${src}`,
      description: item.req,
      source_url: lead.original_post_url,
      confidence: 0.92,
      created_at: lead.created_at,
    });
  });

  return { leads, contacts, scores, signals };
}

export const seedGeneratedData = generateSeedOpportunities();
export const seedLeads = seedGeneratedData.leads;
export const seedContacts = seedGeneratedData.contacts;
export const seedScores = seedGeneratedData.scores;
export const seedSignals = seedGeneratedData.signals;

// 7. Demo Campaigns
export const seedCampaigns: Campaign[] = [
  {
    id: DEMO_CAMPAIGN_1_ID,
    organization_id: DEMO_ORG_ID,
    name: 'Q4 Enterprise M365 Modernization Outreach',
    type: 'LEADS_AND_CALLING',
    status: 'ACTIVE',
    target_timezone: 'America/New_York',
    schedule_cron: '0 9 * * 1-5',
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
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-19T10:00:00Z',
  },
  {
    id: DEMO_CAMPAIGN_2_ID,
    organization_id: DEMO_ORG_ID,
    name: 'Healthcare SharePoint Migration Push',
    type: 'CALLING_ONLY',
    status: 'PAUSED',
    target_timezone: 'America/Chicago',
    schedule_cron: '0 10 * * 1-5',
    config: {
      language: 'en',
      timezone: 'America/Chicago',
      calling_window_start: '10:00',
      calling_window_end: '16:00',
      retry_count: 2,
      voicemail_enabled: true,
      callback_enabled: true,
      frequency: 'daily_batch',
    },
    created_at: '2026-09-12T14:00:00Z',
    updated_at: '2026-09-18T16:00:00Z',
  },
];

export const seedCampaignLeads: CampaignLead[] = [
  {
    id: '00000000-0000-0000-0000-000000000071',
    campaign_id: DEMO_CAMPAIGN_1_ID,
    lead_id: seedLeads[0].id,
    status: 'CONNECTED',
    called_at: '2026-09-18T14:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000072',
    campaign_id: DEMO_CAMPAIGN_1_ID,
    lead_id: seedLeads[1].id,
    status: 'CONNECTED',
    called_at: '2026-09-19T09:15:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000073',
    campaign_id: DEMO_CAMPAIGN_1_ID,
    lead_id: seedLeads[2].id,
    status: 'QUEUED',
  },
];

// 8. Demo Calls
export const seedCalls: Call[] = [
  {
    id: '00000000-0000-0000-0000-000000000081',
    organization_id: DEMO_ORG_ID,
    lead_id: seedLeads[0].id,
    campaign_id: DEMO_CAMPAIGN_1_ID,
    provider: 'simulated',
    direction: 'OUTBOUND',
    status: 'completed',
    started_at: '2026-09-18T14:30:00Z',
    ended_at: '2026-09-18T14:34:45Z',
    duration_seconds: 285,
    language: 'en',
    outcome: 'Decision maker interested in Microsoft 365 E5 migration scoping call.',
    intent: 'HIGH',
    prospect_response_status: 'INTERESTED',
    created_at: '2026-09-18T14:30:00Z',
  },
];

export const seedCallTranscripts: CallTranscript[] = [
  {
    id: '00000000-0000-0000-0000-000000000091',
    call_id: seedCalls[0].id,
    transcript_text:
      "Agent: Hi Dr. Vance, this is Alex from Acme Technologies calling regarding your recent exploration of Microsoft 365 E5 and SharePoint migrations for Apex Health Systems.\n\nDr. Vance: Yes, Alex. We have an on-premise SharePoint 2013 farm and about 1,800 active mailboxes that we need migrated before Q1. HIPAA compliance and zero data loss are non-negotiable.\n\nAgent: Absolutely. Acme Technologies has executed over 50 healthcare migrations with strict Microsoft Purview DLP and BAA compliance frameworks. We can deliver a hybrid staging plan with zero cutover downtime.\n\nDr. Vance: That sounds like what we need. Send over a technical scoping brief and calendar link to my email.\n\nAgent: Will do right away, Dr. Vance. Have a great day!",
    speaker_segments: [
      {
        speaker: 'Agent',
        timestamp: '00:00',
        text: 'Hi Dr. Vance, this is Alex from Acme Technologies calling regarding your recent exploration of Microsoft 365 E5 and SharePoint migrations.',
      },
      {
        speaker: 'Prospect',
        timestamp: '00:15',
        text: 'Yes, Alex. We have an on-premise SharePoint 2013 farm and about 1,800 active mailboxes that we need migrated before Q1. HIPAA compliance is non-negotiable.',
      },
      {
        speaker: 'Agent',
        timestamp: '00:35',
        text: 'Acme Technologies has executed over 50 healthcare migrations with strict Microsoft Purview DLP frameworks and zero cutover downtime.',
      },
      {
        speaker: 'Prospect',
        timestamp: '01:05',
        text: 'Send over a technical scoping brief and calendar link to my email.',
      },
      {
        speaker: 'Agent',
        timestamp: '01:20',
        text: 'Will do right away, Dr. Vance. Have a great day!',
      },
    ],
    created_at: '2026-09-18T14:34:45Z',
  },
];

export const seedCallSummaries: CallSummary[] = [
  {
    id: '00000000-0000-0000-0000-000000000191',
    call_id: seedCalls[0].id,
    summary_text:
      'Dr. Marcus Vance (CIO, Apex Health Systems) confirmed an active project to migrate 1,800 mailboxes and 400 SharePoint 2013 on-prem sites to M365 E5 before Q1. Primary concerns are HIPAA compliance and cutover downtime.',
    key_takeaways: [
      '1,800 mailboxes and 400 SharePoint 2013 on-premise sites targeted for migration',
      'Hard deadline set for Q1 rollout',
      'Mandatory HIPAA compliance and BAA agreement required',
    ],
    objections_raised: [
      'Concerned about mailbox cutover disruption to hospital operations',
    ],
    sentiment: 'POSITIVE',
    next_best_action: 'Send M365 Healthcare Migration Scoping Deck and schedule 30-min technical discovery call with Lead Cloud Architect.',
    created_at: '2026-09-18T14:35:00Z',
  },
];

// 9. Demo Subscriptions & Usage
export const seedSubscription: Subscription = {
  id: '00000000-0000-0000-0000-000000000101',
  organization_id: DEMO_ORG_ID,
  plan_tier: 'GROWTH',
  status: 'ACTIVE',
  allocated_voice_minutes: 2000,
  used_voice_minutes: 425,
  current_period_start: '2026-09-01T00:00:00Z',
  current_period_end: '2026-10-01T00:00:00Z',
};

export const seedUsageRecords: UsageRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000111',
    organization_id: DEMO_ORG_ID,
    metric: 'voice_minutes',
    quantity: 425,
    recorded_at: '2026-09-19T12:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000112',
    organization_id: DEMO_ORG_ID,
    metric: 'leads_discovered',
    quantity: 148,
    recorded_at: '2026-09-19T12:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000113',
    organization_id: DEMO_ORG_ID,
    metric: 'api_calls',
    quantity: 1840,
    recorded_at: '2026-09-19T12:00:00Z',
  },
];

// 10. Demo Notifications
export const seedNotifications: Notification[] = [
  {
    id: '00000000-0000-0000-0000-000000000121',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    title: 'High-Intent Lead Discovered',
    message: 'Apex Health Systems (Intent Score: 95%) published an RFP for Microsoft 365 E5 migration.',
    type: 'high_intent_lead',
    is_read: false,
    metadata: { leadId: seedLeads[0].id },
    created_at: '2026-09-19T10:15:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000122',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    title: 'Voice Call Completed & Prospect Interested',
    message: 'Dr. Marcus Vance requested technical scoping deck during AI voice outreach.',
    type: 'interested_prospect',
    is_read: false,
    metadata: { callId: seedCalls[0].id },
    created_at: '2026-09-18T14:35:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000123',
    organization_id: DEMO_ORG_ID,
    title: 'Campaign Q4 Modernization Launched',
    message: 'Voice campaign is now active across 45 target enterprise accounts.',
    type: 'campaign_started',
    is_read: true,
    metadata: { campaignId: DEMO_CAMPAIGN_1_ID },
    created_at: '2026-09-10T10:00:00Z',
  },
];

// 11. Demo Audit Logs
export const seedAuditLogs: AuditLog[] = [
  {
    id: '00000000-0000-0000-0000-000000000131',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    action: 'login',
    resource_type: 'auth',
    resource_id: DEMO_ADMIN_ID,
    details: { email: 'admin@acmetech.com', authMethod: 'password' },
    ip_address: '192.168.1.100',
    created_at: '2026-09-19T08:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000132',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    action: 'campaign_launched',
    resource_type: 'campaigns',
    resource_id: DEMO_CAMPAIGN_1_ID,
    details: { name: 'Q4 Enterprise M365 Modernization Outreach', leadCount: 45 },
    ip_address: '192.168.1.100',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000133',
    organization_id: DEMO_ORG_ID,
    user_id: DEMO_ADMIN_ID,
    action: 'lead_imported',
    resource_type: 'leads',
    resource_id: 'batch-001',
    details: { count: 30, format: 'xlsx', duplicatesSkipped: 0 },
    ip_address: '192.168.1.100',
    created_at: '2026-09-05T11:00:00Z',
  },
];

// 12. Demo Fraud Events
export const seedFraudEvents: FraudEvent[] = [
  {
    id: '00000000-0000-0000-0000-000000000141',
    organization_id: DEMO_ORG_ID,
    severity: 'LOW',
    event_type: 'suspicious_login_attempt',
    description: '3 consecutive failed password attempts detected from external IP 203.0.113.45',
    status: 'RESOLVED',
    metadata: { ip: '203.0.113.45', email: 'admin@acmetech.com', attempts: 3 },
    created_at: '2026-09-15T03:14:00Z',
  },
];

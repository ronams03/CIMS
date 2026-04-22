import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.riskSignal.deleteMany()
  await prisma.marketShare.deleteMany()
  await prisma.subcontractorLink.deleteMany()
  await prisma.contractModification.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.agency.deleteMany()
  await prisma.contractor.deleteMany()

  // Create Agencies
  const agencies = await Promise.all([
    prisma.agency.create({ data: { name: 'Department of Defense', code: 'DOD', level: 'federal', category: 'defense', budget: 740000 } }),
    prisma.agency.create({ data: { name: 'Department of Health & Human Services', code: 'HHS', level: 'federal', category: 'health', budget: 130000 } }),
    prisma.agency.create({ data: { name: 'General Services Administration', code: 'GSA', level: 'federal', category: 'IT', budget: 28000 } }),
    prisma.agency.create({ data: { name: 'Department of Transportation', code: 'DOT', level: 'federal', category: 'infrastructure', budget: 95000 } }),
    prisma.agency.create({ data: { name: 'Department of Energy', code: 'DOE', level: 'federal', category: 'energy', budget: 42000 } }),
    prisma.agency.create({ data: { name: 'Department of Homeland Security', code: 'DHS', level: 'federal', category: 'security', budget: 52000 } }),
    prisma.agency.create({ data: { name: 'Department of Veterans Affairs', code: 'VA', level: 'federal', category: 'health', budget: 240000 } }),
    prisma.agency.create({ data: { name: 'NASA', code: 'NASA', level: 'federal', category: 'aerospace', budget: 24000 } }),
    prisma.agency.create({ data: { name: 'State of California DOT', code: 'CALTRANS', level: 'state', category: 'infrastructure', budget: 18000 } }),
    prisma.agency.create({ data: { name: 'NYC Department of IT', code: 'NYCDOITT', level: 'municipal', category: 'IT', budget: 1200 } }),
  ])

  // Create Contractors
  const contractors = await Promise.all([
    prisma.contractor.create({ data: { name: 'Lockheed Martin Corp', registrationId: 'REG-001', type: 'corporation', industry: 'defense', city: 'Bethesda', state: 'MD', riskScore: 72 } }),
    prisma.contractor.create({ data: { name: 'Boeing Company', registrationId: 'REG-002', type: 'corporation', industry: 'aerospace', city: 'Chicago', state: 'IL', riskScore: 58 } }),
    prisma.contractor.create({ data: { name: 'Raytheon Technologies', registrationId: 'REG-003', type: 'corporation', industry: 'defense', city: 'Waltham', state: 'MA', riskScore: 65 } }),
    prisma.contractor.create({ data: { name: 'General Dynamics', registrationId: 'REG-004', type: 'corporation', industry: 'defense', city: 'Reston', state: 'VA', riskScore: 55 } }),
    prisma.contractor.create({ data: { name: 'Northrop Grumman', registrationId: 'REG-005', type: 'corporation', industry: 'defense', city: 'Falls Church', state: 'VA', riskScore: 68 } }),
    prisma.contractor.create({ data: { name: 'Accenture Federal', registrationId: 'REG-006', type: 'corporation', industry: 'consulting', city: 'Arlington', state: 'VA', riskScore: 42 } }),
    prisma.contractor.create({ data: { name: 'Deloitte Consulting LLP', registrationId: 'REG-007', type: 'corporation', industry: 'consulting', city: 'New York', state: 'NY', riskScore: 38 } }),
    prisma.contractor.create({ data: { name: 'IBM Corporation', registrationId: 'REG-008', type: 'corporation', industry: 'IT', city: 'Armonk', state: 'NY', riskScore: 35 } }),
    prisma.contractor.create({ data: { name: 'Microsoft Federal', registrationId: 'REG-009', type: 'corporation', industry: 'IT', city: 'Redmond', state: 'WA', riskScore: 30 } }),
    prisma.contractor.create({ data: { name: 'Amazon Web Services', registrationId: 'REG-010', type: 'corporation', industry: 'IT', city: 'Seattle', state: 'WA', riskScore: 45 } }),
    prisma.contractor.create({ data: { name: 'Leidos Holdings', registrationId: 'REG-011', type: 'corporation', industry: 'IT', city: 'Reston', state: 'VA', riskScore: 52 } }),
    prisma.contractor.create({ data: { name: 'SAIC Inc', registrationId: 'REG-012', type: 'corporation', industry: 'IT', city: 'Reston', state: 'VA', riskScore: 48 } }),
    prisma.contractor.create({ data: { name: 'Booz Allen Hamilton', registrationId: 'REG-013', type: 'corporation', industry: 'consulting', city: 'McLean', state: 'VA', riskScore: 44 } }),
    prisma.contractor.create({ data: { name: 'Fluor Corporation', registrationId: 'REG-014', type: 'corporation', industry: 'infrastructure', city: 'Irving', state: 'TX', riskScore: 40 } }),
    prisma.contractor.create({ data: { name: 'Bechtel Group', registrationId: 'REG-015', type: 'corporation', industry: 'infrastructure', city: 'San Francisco', state: 'CA', riskScore: 36 } }),
    prisma.contractor.create({ data: { name: 'Palantir Technologies', registrationId: 'REG-016', type: 'corporation', industry: 'IT', city: 'Denver', state: 'CO', riskScore: 62 } }),
    prisma.contractor.create({ data: { name: 'C3 AI', registrationId: 'REG-017', type: 'corporation', industry: 'IT', city: 'Redwood City', state: 'CA', riskScore: 55 } }),
    prisma.contractor.create({ data: { name: 'CGI Federal', registrationId: 'REG-018', type: 'corporation', industry: 'IT', city: 'Fairfax', state: 'VA', riskScore: 33 } }),
    prisma.contractor.create({ data: { name: 'KBR Inc', registrationId: 'REG-019', type: 'corporation', industry: 'defense', city: 'Houston', state: 'TX', riskScore: 50 } }),
    prisma.contractor.create({ data: { name: 'Huntington Ingalls', registrationId: 'REG-020', type: 'corporation', industry: 'defense', city: 'Newport News', state: 'VA', riskScore: 47 } }),
  ])

  // Create Contracts
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0001', title: 'F-35 Lightning II Sustainment Support', description: 'Continued sustainment and maintenance support for the F-35 Lightning II fleet across multiple service branches.',
        agencyId: agencies[0].id, primeContractorId: contractors[0].id, category: 'defense',
        initialValue: 12500000, totalObligated: 18750000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-06-15'), awardDate: new Date('2024-01-10'), endDate: new Date('2026-12-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0002', title: 'VA Electronic Health Record Modernization', description: 'Implementation and sustainment of Cerner electronic health record system across VA facilities.',
        agencyId: agencies[6].id, primeContractorId: contractors[7].id, category: 'IT',
        initialValue: 50000000, totalObligated: 98000000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2024-02-28'), endDate: new Date('2027-06-30'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0003', title: 'GSA Cloud Infrastructure Services', description: 'Enterprise cloud computing infrastructure and managed services for federal agencies.',
        agencyId: agencies[2].id, primeContractorId: contractors[9].id, category: 'IT',
        initialValue: 8000000, totalObligated: 12000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-09-01'), awardDate: new Date('2024-03-15'), endDate: new Date('2026-03-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0004', title: 'DHS Border Security Technology', description: 'Advanced surveillance and detection technology systems for border security operations.',
        agencyId: agencies[5].id, primeContractorId: contractors[2].id, category: 'defense',
        initialValue: 32000000, totalObligated: 32000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-11-01'), awardDate: new Date('2024-04-20'), endDate: new Date('2027-04-19'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0005', title: 'DOT Highway Bridge Replacement Program', description: 'Design and construction management for highway bridge replacement across the northeast corridor.',
        agencyId: agencies[3].id, primeContractorId: contractors[13].id, category: 'infrastructure',
        initialValue: 45000000, totalObligated: 52000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-07-20'), awardDate: new Date('2024-01-05'), endDate: new Date('2027-12-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0006', title: 'DOE Nuclear Facility Decommissioning', description: 'Decommissioning and environmental remediation of legacy nuclear research facilities.',
        agencyId: agencies[4].id, primeContractorId: contractors[14].id, category: 'infrastructure',
        initialValue: 67000000, totalObligated: 95000000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2024-05-15'), endDate: new Date('2029-05-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0007', title: 'HHS Pandemic Preparedness Data Platform', description: 'Development and operation of a national-scale pandemic surveillance and response data platform.',
        agencyId: agencies[1].id, primeContractorId: contractors[15].id, category: 'IT',
        initialValue: 15000000, totalObligated: 28500000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2024-06-30'), endDate: new Date('2026-06-29'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0008', title: 'NASA Artemis Program Support', description: 'Systems engineering and integration support for the Artemis lunar exploration program.',
        agencyId: agencies[7].id, primeContractorId: contractors[1].id, category: 'defense',
        initialValue: 28900000, totalObligated: 28900000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-08-10'), awardDate: new Date('2024-02-14'), endDate: new Date('2028-02-13'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0009', title: 'DOD Cybersecurity Operations Center', description: 'Design, build, and operate a next-generation security operations center for DOD networks.',
        agencyId: agencies[0].id, primeContractorId: contractors[10].id, category: 'IT',
        initialValue: 22000000, totalObligated: 35000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-10-15'), awardDate: new Date('2024-03-30'), endDate: new Date('2027-03-29'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0010', title: 'CALTRANS High-Speed Rail Construction', description: 'Construction management and oversight for California high-speed rail segments.',
        agencyId: agencies[8].id, primeContractorId: contractors[14].id, category: 'infrastructure',
        initialValue: 120000000, totalObligated: 156000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-05-01'), awardDate: new Date('2023-12-15'), endDate: new Date('2028-12-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0011', title: 'NYC 311 System Modernization', description: 'Complete modernization of the NYC 311 citizen services platform including AI-powered routing.',
        agencyId: agencies[9].id, primeContractorId: contractors[5].id, category: 'IT',
        initialValue: 5500000, totalObligated: 5500000, awardMethod: 'competitive', status: 'completed',
        bidDate: new Date('2022-03-01'), awardDate: new Date('2022-09-01'), endDate: new Date('2024-08-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0012', title: 'VA Telehealth Infrastructure Expansion', description: 'Expansion of telehealth capabilities across VA medical centers and community-based outpatient clinics.',
        agencyId: agencies[6].id, primeContractorId: contractors[8].id, category: 'IT',
        initialValue: 18000000, totalObligated: 18000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2024-01-15'), awardDate: new Date('2024-06-01'), endDate: new Date('2026-05-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0013', title: 'DOD Joint All-Domain Command & Control', description: 'Development of JADC2 capability integrating sensors and effectors across all domains.',
        agencyId: agencies[0].id, primeContractorId: contractors[4].id, category: 'defense',
        initialValue: 45000000, totalObligated: 78000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-04-20'), awardDate: new Date('2023-11-15'), endDate: new Date('2027-11-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0014', title: 'GSA Federal Building Energy Retrofit', description: 'Energy efficiency retrofits across 50 federal buildings under the Green Building Initiative.',
        agencyId: agencies[2].id, primeContractorId: contractors[13].id, category: 'infrastructure',
        initialValue: 28000000, totalObligated: 28000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2024-02-01'), awardDate: new Date('2024-07-10'), endDate: new Date('2026-07-09'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0015', title: 'HHS Medicare Fraud Detection AI', description: 'AI-powered predictive analytics platform for Medicare fraud, waste, and abuse detection.',
        agencyId: agencies[1].id, primeContractorId: contractors[15].id, category: 'IT',
        initialValue: 9500000, totalObligated: 14200000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2024-04-10'), endDate: new Date('2026-04-09'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0016', title: 'DHS Immigration Case Management System', description: 'Cloud-based case management system for immigration proceedings and adjudications.',
        agencyId: agencies[5].id, primeContractorId: contractors[11].id, category: 'IT',
        initialValue: 12000000, totalObligated: 18500000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-12-01'), awardDate: new Date('2024-05-20'), endDate: new Date('2026-05-19'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0017', title: 'DOE Grid Modernization Initiative', description: 'Advanced grid monitoring, control systems, and renewable energy integration R&D.',
        agencyId: agencies[4].id, primeContractorId: contractors[5].id, category: 'energy',
        initialValue: 35000000, totalObligated: 35000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2024-01-10'), awardDate: new Date('2024-06-15'), endDate: new Date('2027-06-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0018', title: 'DOD Ship Maintenance & Repair Contract', description: 'Sustainment, maintenance, and modernization of naval surface combatant ships.',
        agencyId: agencies[0].id, primeContractorId: contractors[19].id, category: 'defense',
        initialValue: 89000000, totalObligated: 112000000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2024-03-01'), endDate: new Date('2028-02-28'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0019', title: 'NASA Mars Sample Return Mission', description: 'Systems design, development, and integration for the Mars Sample Return mission architecture.',
        agencyId: agencies[7].id, primeContractorId: contractors[4].id, category: 'aerospace',
        initialValue: 65000000, totalObligated: 65000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-09-15'), awardDate: new Date('2024-01-20'), endDate: new Date('2030-01-19'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0020', title: 'DOT Smart Traffic Management System', description: 'AI-driven traffic flow optimization and connected vehicle infrastructure deployment.',
        agencyId: agencies[3].id, primeContractorId: contractors[16].id, category: 'IT',
        initialValue: 7200000, totalObligated: 7200000, awardMethod: 'competitive', status: 'completed',
        bidDate: new Date('2022-06-15'), awardDate: new Date('2022-12-01'), endDate: new Date('2024-11-30'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0021', title: 'DOD Intelligence Analysis Platform', description: 'Advanced AI/ML intelligence analysis and fusion platform for DIA and combatant commands.',
        agencyId: agencies[0].id, primeContractorId: contractors[12].id, category: 'IT',
        initialValue: 30000000, totalObligated: 54000000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2023-03-15'), endDate: new Date('2026-03-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0022', title: 'GSA Identity Access Management', description: 'Enterprise identity, credential, and access management (ICAM) solution for federal workforce.',
        agencyId: agencies[2].id, primeContractorId: contractors[17].id, category: 'IT',
        initialValue: 6800000, totalObligated: 9200000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2022-10-01'), awardDate: new Date('2023-01-20'), endDate: new Date('2026-01-19'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0023', title: 'HHS Clinical Trial Data Management', description: 'Modernized clinical trial data capture and management system for NIH-sponsored research.',
        agencyId: agencies[1].id, primeContractorId: contractors[7].id, category: 'IT',
        initialValue: 11000000, totalObligated: 11000000, awardMethod: 'competitive', status: 'completed',
        bidDate: new Date('2022-04-01'), awardDate: new Date('2022-10-15'), endDate: new Date('2024-10-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0024', title: 'VA Supply Chain Optimization', description: 'Supply chain analytics and logistics optimization for VA medical supply distribution.',
        agencyId: agencies[6].id, primeContractorId: contractors[6].id, category: 'consulting',
        initialValue: 4500000, totalObligated: 7800000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-02-01'), awardDate: new Date('2023-07-01'), endDate: new Date('2025-06-30'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0025', title: 'DOE Nuclear Waste Storage Facility', description: 'Design and construction oversight for expanded nuclear waste interim storage facility.',
        agencyId: agencies[4].id, primeContractorId: contractors[18].id, category: 'infrastructure',
        initialValue: 85000000, totalObligated: 105000000, awardMethod: 'sole-source', status: 'active',
        bidDate: null, awardDate: new Date('2023-05-10'), endDate: new Date('2029-05-09'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2023-0026', title: 'DHS Biometric Entry/Exit System', description: 'Biometric identification system for border entry/exit processing at ports of entry.',
        agencyId: agencies[5].id, primeContractorId: contractors[15].id, category: 'IT',
        initialValue: 42000000, totalObligated: 61000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2022-11-15'), awardDate: new Date('2023-04-01'), endDate: new Date('2027-03-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0027', title: 'DOD Satellite Communications Upgrade', description: 'Next-generation SATCOM terminal deployment for tactical communications.',
        agencyId: agencies[0].id, primeContractorId: contractors[3].id, category: 'defense',
        initialValue: 38000000, totalObligated: 38000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2024-01-20'), awardDate: new Date('2024-07-15'), endDate: new Date('2027-07-14'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0028', title: 'DOT Airport Modernization Program', description: 'Infrastructure upgrades for 12 regional airports including runway and terminal improvements.',
        agencyId: agencies[3].id, primeContractorId: contractors[13].id, category: 'infrastructure',
        initialValue: 95000000, totalObligated: 95000000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2024-03-01'), awardDate: new Date('2024-08-01'), endDate: new Date('2028-07-31'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0029', title: 'Emergency COVID Response IT Systems', description: 'Emergency procurement of IT infrastructure for COVID-19 vaccine distribution tracking.',
        agencyId: agencies[1].id, primeContractorId: contractors[9].id, category: 'IT',
        initialValue: 22000000, totalObligated: 38000000, awardMethod: 'emergency', status: 'completed',
        bidDate: null, awardDate: new Date('2023-12-20'), endDate: new Date('2024-12-19'),
      }
    }),
    prisma.contract.create({
      data: {
        contractId: 'CTR-2024-0030', title: 'GSA Federal Cloud Email Migration', description: 'Migration of 1.2M federal email accounts to cloud platform with zero-trust security.',
        agencyId: agencies[2].id, primeContractorId: contractors[8].id, category: 'IT',
        initialValue: 14000000, totalObligated: 19500000, awardMethod: 'competitive', status: 'active',
        bidDate: new Date('2023-08-15'), awardDate: new Date('2024-02-01'), endDate: new Date('2026-01-31'),
      }
    }),
  ])

  // Create Contract Modifications
  const modData = [
    { contractIdx: 0, modNumber: 1, description: 'Additional sustainment scope for F-35 Block 4 upgrade', valueChange: 3200000, modDate: new Date('2024-06-15'), reason: 'scope change' },
    { contractIdx: 0, modNumber: 2, description: 'Funding increase for extended maintenance period', valueChange: 3050000, modDate: new Date('2024-09-20'), reason: 'funding adjustment' },
    { contractIdx: 1, modNumber: 1, description: 'EHR implementation expanded to 50 additional VA facilities', valueChange: 15000000, modDate: new Date('2024-05-10'), reason: 'scope change' },
    { contractIdx: 1, modNumber: 2, description: 'Data migration complexity increase', valueChange: 8000000, modDate: new Date('2024-08-15'), reason: 'scope change' },
    { contractIdx: 1, modNumber: 3, description: 'Additional training and change management', valueChange: 25000000, modDate: new Date('2024-11-01'), reason: 'scope change' },
    { contractIdx: 2, modNumber: 1, description: 'Cloud capacity expansion for AI workloads', valueChange: 4000000, modDate: new Date('2024-07-01'), reason: 'funding adjustment' },
    { contractIdx: 4, modNumber: 1, description: 'Additional bridge inspections required', valueChange: 4500000, modDate: new Date('2024-06-20'), reason: 'scope change' },
    { contractIdx: 4, modNumber: 2, description: 'Material cost escalation', valueChange: 2500000, modDate: new Date('2024-09-15'), reason: 'funding adjustment' },
    { contractIdx: 5, modNumber: 1, description: 'Extended remediation scope - contaminated areas found', valueChange: 18000000, modDate: new Date('2024-08-10'), reason: 'scope change' },
    { contractIdx: 5, modNumber: 2, description: 'Regulatory compliance upgrades', valueChange: 10000000, modDate: new Date('2024-12-01'), reason: 'scope change' },
    { contractIdx: 6, modNumber: 1, description: 'Platform scope expanded to include monkeypox tracking', valueChange: 8500000, modDate: new Date('2024-09-01'), reason: 'scope change' },
    { contractIdx: 6, modNumber: 2, description: 'Data integration with CDC systems', valueChange: 5000000, modDate: new Date('2024-11-15'), reason: 'scope change' },
    { contractIdx: 8, modNumber: 1, description: 'SOC expansion to include zero-trust architecture', valueChange: 8000000, modDate: new Date('2024-08-20'), reason: 'scope change' },
    { contractIdx: 8, modNumber: 2, description: 'Additional cybersecurity analysts funding', valueChange: 5000000, modDate: new Date('2024-12-10'), reason: 'funding adjustment' },
    { contractIdx: 9, modNumber: 1, description: 'Route alignment changes increase construction scope', valueChange: 24000000, modDate: new Date('2024-07-15'), reason: 'scope change' },
    { contractIdx: 9, modNumber: 2, description: 'Environmental mitigation requirements', valueChange: 12000000, modDate: new Date('2024-10-01'), reason: 'scope change' },
    { contractIdx: 12, modNumber: 1, description: 'JADC2 integration expanded to Space Force', valueChange: 18000000, modDate: new Date('2024-06-01'), reason: 'scope change' },
    { contractIdx: 12, modNumber: 2, description: 'Additional sensor integration', valueChange: 15000000, modDate: new Date('2024-10-15'), reason: 'scope change' },
    { contractIdx: 14, modNumber: 1, description: 'AI model retraining and data expansion', valueChange: 4700000, modDate: new Date('2024-09-10'), reason: 'scope change' },
    { contractIdx: 15, modNumber: 1, description: 'Case volume increase requiring system scaling', valueChange: 4000000, modDate: new Date('2024-08-15'), reason: 'funding adjustment' },
    { contractIdx: 15, modNumber: 2, description: 'Integration with border processing systems', valueChange: 2500000, modDate: new Date('2024-11-20'), reason: 'scope change' },
    { contractIdx: 17, modNumber: 1, description: 'Additional ship classes added to maintenance contract', valueChange: 15000000, modDate: new Date('2024-07-01'), reason: 'scope change' },
    { contractIdx: 17, modNumber: 2, description: 'Emergency repair funding', valueChange: 8000000, modDate: new Date('2024-10-20'), reason: 'funding adjustment' },
    { contractIdx: 20, modNumber: 1, description: 'Platform capability expansion for new intelligence sources', valueChange: 12000000, modDate: new Date('2023-09-01'), reason: 'scope change' },
    { contractIdx: 20, modNumber: 2, description: 'ML model accuracy improvement initiative', valueChange: 8000000, modDate: new Date('2024-03-15'), reason: 'scope change' },
    { contractIdx: 20, modNumber: 3, description: 'Additional analytic workstations', valueChange: 4000000, modDate: new Date('2024-08-01'), reason: 'funding adjustment' },
    { contractIdx: 21, modNumber: 1, description: 'ICAM expansion to include PIV-II credentials', valueChange: 2400000, modDate: new Date('2023-07-20'), reason: 'scope change' },
    { contractIdx: 23, modNumber: 1, description: 'Supply chain scope expanded to include pharmaceuticals', valueChange: 2000000, modDate: new Date('2023-12-01'), reason: 'scope change' },
    { contractIdx: 23, modNumber: 2, description: 'Analytics platform upgrade', valueChange: 1300000, modDate: new Date('2024-06-15'), reason: 'funding adjustment' },
    { contractIdx: 24, modNumber: 1, description: 'Facility capacity expansion', valueChange: 12000000, modDate: new Date('2023-10-15'), reason: 'scope change' },
    { contractIdx: 24, modNumber: 2, description: 'Safety compliance upgrades', valueChange: 8000000, modDate: new Date('2024-04-01'), reason: 'scope change' },
    { contractIdx: 25, modNumber: 1, description: 'Biometric modal expansion - iris and voice', valueChange: 10000000, modDate: new Date('2023-09-15'), reason: 'scope change' },
    { contractIdx: 25, modNumber: 2, description: 'International integration requirements', valueChange: 9000000, modDate: new Date('2024-02-20'), reason: 'scope change' },
    { contractIdx: 28, modNumber: 1, description: 'Vaccine tracking scope expanded to boosters', valueChange: 8000000, modDate: new Date('2024-03-15'), reason: 'scope change' },
    { contractIdx: 28, modNumber: 2, description: 'Data center capacity increase', valueChange: 8000000, modDate: new Date('2024-07-10'), reason: 'funding adjustment' },
    { contractIdx: 29, modNumber: 1, description: 'Additional agencies added to migration', valueChange: 3500000, modDate: new Date('2024-06-15'), reason: 'scope change' },
    { contractIdx: 29, modNumber: 2, description: 'Security compliance enhancements', valueChange: 2000000, modDate: new Date('2024-10-01'), reason: 'funding adjustment' },
  ]

  for (const mod of modData) {
    await prisma.contractModification.create({
      data: {
        contractId: contracts[mod.contractIdx].id,
        modNumber: mod.modNumber,
        description: mod.description,
        valueChange: mod.valueChange,
        modDate: mod.modDate,
        reason: mod.reason,
      }
    })
  }

  // Create Subcontractor Links
  const subLinks = [
    { contractIdx: 0, contractorIdx: 3, subValue: 2500000, description: 'Ground support equipment' },
    { contractIdx: 0, contractorIdx: 18, subValue: 1800000, description: 'Engine maintenance support' },
    { contractIdx: 1, contractorIdx: 11, subValue: 8000000, description: 'System integration services' },
    { contractIdx: 1, contractorIdx: 12, subValue: 5000000, description: 'Change management consulting' },
    { contractIdx: 2, contractorIdx: 8, subValue: 3000000, description: 'Azure cloud licensing' },
    { contractIdx: 3, contractorIdx: 15, subValue: 6000000, description: 'Data analytics platform' },
    { contractIdx: 3, contractorIdx: 4, subValue: 4000000, description: 'Sensor integration' },
    { contractIdx: 4, contractorIdx: 14, subValue: 12000000, description: 'Structural engineering' },
    { contractIdx: 5, contractorIdx: 18, subValue: 15000000, description: 'Waste processing systems' },
    { contractIdx: 6, contractorIdx: 9, subValue: 5000000, description: 'Cloud infrastructure' },
    { contractIdx: 7, contractorIdx: 4, subValue: 8000000, description: 'Spacecraft systems' },
    { contractIdx: 8, contractorIdx: 12, subValue: 4000000, description: 'Cyber threat intelligence' },
    { contractIdx: 8, contractorIdx: 16, subValue: 3000000, description: 'AI/ML analytics' },
    { contractIdx: 9, contractorIdx: 13, subValue: 20000000, description: 'Construction management' },
    { contractIdx: 9, contractorIdx: 18, subValue: 15000000, description: 'Environmental consulting' },
    { contractIdx: 12, contractorIdx: 15, subValue: 8000000, description: 'AI integration' },
    { contractIdx: 12, contractorIdx: 10, subValue: 6000000, description: 'Network infrastructure' },
    { contractIdx: 17, contractorIdx: 3, subValue: 12000000, description: 'Combat systems upgrade' },
    { contractIdx: 17, contractorIdx: 1, subValue: 8000000, description: 'Propulsion systems' },
    { contractIdx: 18, contractorIdx: 1, subValue: 10000000, description: 'Launch vehicle systems' },
    { contractIdx: 20, contractorIdx: 15, subValue: 8000000, description: 'Analytics platform' },
    { contractIdx: 20, contractorIdx: 16, subValue: 4000000, description: 'AI inference engine' },
    { contractIdx: 25, contractorIdx: 16, subValue: 5000000, description: 'Facial recognition AI' },
    { contractIdx: 25, contractorIdx: 10, subValue: 4000000, description: 'Network infrastructure' },
    { contractIdx: 24, contractorIdx: 13, subValue: 8000000, description: 'Construction management' },
    { contractIdx: 24, contractorIdx: 18, subValue: 5000000, description: 'Safety engineering' },
    { contractIdx: 27, contractorIdx: 14, subValue: 15000000, description: 'Structural engineering' },
    { contractIdx: 27, contractorIdx: 13, subValue: 10000000, description: 'Project management' },
  ]

  for (const link of subLinks) {
    await prisma.subcontractorLink.create({
      data: {
        contractId: contracts[link.contractIdx].id,
        contractorId: contractors[link.contractorIdx].id,
        subValue: link.subValue,
        description: link.description,
      }
    })
  }

  // Create Risk Signals
  const riskSignals = [
    { contractIdx: 1, signalType: 'sole-source', severity: 'high', description: 'VA EHR modernization awarded sole-source to IBM despite multiple qualified vendors. Initial value of $50M has grown 96% to $98M through 3 modifications.' },
    { contractIdx: 5, signalType: 'sole-source', severity: 'high', description: 'DOE nuclear decommissioning sole-source to Bechtel with 41.8% value increase from modifications.' },
    { contractIdx: 6, signalType: 'sole-source', severity: 'medium', description: 'HHS pandemic platform sole-source to Palantir. 90% value increase from initial award.' },
    { contractIdx: 14, signalType: 'sole-source', severity: 'medium', description: 'Medicare fraud detection AI sole-source to Palantir with 49.5% value increase.' },
    { contractIdx: 17, signalType: 'sole-source', severity: 'high', description: 'DOD ship maintenance sole-source to Huntington Ingalls. Value grew 25.8% to $112M.' },
    { contractIdx: 24, signalType: 'sole-source', severity: 'medium', description: 'DOE nuclear waste storage sole-source to KBR with 23.5% value growth.' },
    { contractIdx: 20, signalType: 'scope-creep', severity: 'critical', description: 'DOD intelligence platform grew from $30M to $54M (80% increase) through 3 modifications in 18 months.' },
    { contractIdx: 9, signalType: 'scope-creep', severity: 'high', description: 'CALTRANS rail contract grew from $120M to $156M (30% increase) through scope expansions and environmental mitigation.' },
    { contractIdx: 1, signalType: 'scope-creep', severity: 'critical', description: 'VA EHR contract value nearly doubled from initial award through repeated scope additions without re-bidding.' },
    { contractIdx: 28, signalType: 'timing-irregularity', severity: 'medium', description: 'Emergency COVID IT contract awarded on 12/20/2023 (end of quarter) with no competitive bidding process.' },
    { contractIdx: 15, signalType: 'concentration', severity: 'medium', description: 'Palantir appears as prime contractor on 3 separate HHS/DHS contracts with cumulative value exceeding $91M.' },
    { contractIdx: 8, signalType: 'scope-creep', severity: 'high', description: 'DOD Cyber SOC contract grew from $22M to $35M (59% increase) through scope additions.' },
    { contractIdx: 25, signalType: 'scope-creep', severity: 'high', description: 'DHS biometric system grew from $42M to $61M (45% increase) through scope additions without re-bidding.' },
    { contractIdx: 17, signalType: 'scope-creep', severity: 'medium', description: 'Ship maintenance contract grew from $89M to $112M through additions of ship classes and emergency repairs.' },
  ]

  for (const signal of riskSignals) {
    await prisma.riskSignal.create({
      data: {
        contractId: contracts[signal.contractIdx].id,
        signalType: signal.signalType,
        severity: signal.severity,
        description: signal.description,
        isResolved: false,
      }
    })
  }

  // Create Market Share data
  const marketShares = [
    { contractorIdx: 0, category: 'defense', winRate: 28.5, totalValue: 12500000, contractCount: 3, period: '2024' },
    { contractorIdx: 1, category: 'aerospace', winRate: 22.0, totalValue: 28900000, contractCount: 2, period: '2024' },
    { contractorIdx: 2, category: 'defense', winRate: 18.5, totalValue: 32000000, contractCount: 2, period: '2024' },
    { contractorIdx: 3, category: 'defense', winRate: 12.0, totalValue: 38000000, contractCount: 1, period: '2024' },
    { contractorIdx: 4, category: 'defense', winRate: 15.0, totalValue: 103000000, contractCount: 2, period: '2024' },
    { contractorIdx: 5, category: 'consulting', winRate: 35.0, totalValue: 40500000, contractCount: 2, period: '2024' },
    { contractorIdx: 6, category: 'consulting', winRate: 25.0, totalValue: 4500000, contractCount: 1, period: '2024' },
    { contractorIdx: 7, category: 'IT', winRate: 18.0, totalValue: 61000000, contractCount: 2, period: '2024' },
    { contractorIdx: 8, category: 'IT', winRate: 22.0, totalValue: 32000000, contractCount: 2, period: '2024' },
    { contractorIdx: 9, category: 'IT', winRate: 15.5, totalValue: 20000000, contractCount: 2, period: '2024' },
    { contractorIdx: 10, category: 'IT', winRate: 14.0, totalValue: 22000000, contractCount: 1, period: '2024' },
    { contractorIdx: 11, category: 'IT', winRate: 10.0, totalValue: 12000000, contractCount: 1, period: '2024' },
    { contractorIdx: 12, category: 'consulting', winRate: 20.0, totalValue: 30000000, contractCount: 1, period: '2024' },
    { contractorIdx: 13, category: 'infrastructure', winRate: 25.0, totalValue: 123000000, contractCount: 2, period: '2024' },
    { contractorIdx: 14, category: 'infrastructure', winRate: 20.0, totalValue: 187000000, contractCount: 2, period: '2024' },
    { contractorIdx: 15, category: 'IT', winRate: 8.0, totalValue: 51500000, contractCount: 2, period: '2024' },
    { contractorIdx: 16, category: 'IT', winRate: 6.0, totalValue: 7200000, contractCount: 1, period: '2024' },
    { contractorIdx: 17, category: 'IT', winRate: 8.5, totalValue: 6800000, contractCount: 1, period: '2024' },
    { contractorIdx: 18, category: 'defense', winRate: 10.0, totalValue: 85000000, contractCount: 1, period: '2024' },
    { contractorIdx: 19, category: 'defense', winRate: 12.0, totalValue: 89000000, contractCount: 1, period: '2024' },
    // Q1-2024 period
    { contractorIdx: 0, category: 'defense', winRate: 30.0, totalValue: 5000000, contractCount: 1, period: 'Q1-2024' },
    { contractorIdx: 4, category: 'defense', winRate: 20.0, totalValue: 65000000, contractCount: 1, period: 'Q1-2024' },
    { contractorIdx: 9, category: 'IT', winRate: 25.0, totalValue: 8000000, contractCount: 1, period: 'Q1-2024' },
    { contractorIdx: 14, category: 'infrastructure', winRate: 30.0, totalValue: 120000000, contractCount: 1, period: 'Q1-2024' },
    // Q2-2024 period
    { contractorIdx: 0, category: 'defense', winRate: 26.0, totalValue: 7500000, contractCount: 2, period: 'Q2-2024' },
    { contractorIdx: 1, category: 'aerospace', winRate: 24.0, totalValue: 28900000, contractCount: 1, period: 'Q2-2024' },
    { contractorIdx: 5, category: 'consulting', winRate: 32.0, totalValue: 35000000, contractCount: 1, period: 'Q2-2024' },
    { contractorIdx: 8, category: 'IT', winRate: 20.0, totalValue: 18000000, contractCount: 1, period: 'Q2-2024' },
  ]

  for (const ms of marketShares) {
    await prisma.marketShare.create({
      data: {
        category: ms.category,
        contractorId: contractors[ms.contractorIdx].id,
        winRate: ms.winRate,
        totalValue: ms.totalValue,
        contractCount: ms.contractCount,
        period: ms.period,
      }
    })
  }

  console.log('Seed data created successfully!')
  console.log(`  Agencies: ${agencies.length}`)
  console.log(`  Contractors: ${contractors.length}`)
  console.log(`  Contracts: ${contracts.length}`)
  console.log(`  Modifications: ${modData.length}`)
  console.log(`  Subcontractor Links: ${subLinks.length}`)
  console.log(`  Risk Signals: ${riskSignals.length}`)
  console.log(`  Market Shares: ${marketShares.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample cases
  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-001',
      caseName: 'Samsung Galaxy S21 - Drug Investigation',
      description: 'Investigation involving suspected drug trafficking activities',
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-002',
      caseName: 'iPhone 14 Pro - Financial Fraud',
      description: 'Analysis of financial fraud and money laundering activities',
    },
  });

  const case3 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-003',
      caseName: 'OnePlus 9 - Cybercrime Investigation',
      description: 'Cybercrime investigation involving data theft and unauthorized access',
    },
  });

  console.log('✅ Cases created');

  // Create sample reports
  const reports = [
    {
      reportName: 'Samsung Galaxy S21 - Drug Investigation Analysis',
      reportType: 'Standard Forensic Report',
      caseId: case1.id,
      content: {
        officer: 'Det. Johnson',
        findings: 847,
        pages: 45,
        status: 'final',
        sections: [
          'Executive Summary',
          'Device Information',
          'Data Analysis',
          'Findings',
          'Conclusions',
          'Appendices'
        ],
        summary: 'Comprehensive analysis revealed significant evidence of drug-related communications and financial transactions.',
        keyFindings: [
          'Multiple encrypted messaging apps with suspicious conversations',
          'Financial transactions consistent with drug sales',
          'Location data correlating with known drug activity areas',
          'Deleted messages recovered containing incriminating evidence'
        ]
      },
    },
    {
      reportName: 'iPhone 14 Pro - Financial Fraud Case Summary',
      reportType: 'Executive Summary',
      caseId: case2.id,
      content: {
        officer: 'Det. Smith',
        findings: 1203,
        pages: 12,
        status: 'draft',
        sections: [
          'Key Findings',
          'Risk Assessment',
          'Recommendations',
          'Next Steps'
        ],
        summary: 'Evidence indicates sophisticated financial fraud scheme involving multiple accounts and cryptocurrency transactions.',
        keyFindings: [
          'Unauthorized access to banking applications',
          'Cryptocurrency wallet transactions exceeding $50,000',
          'Fake identity documents stored on device',
          'Communication with known fraud networks'
        ]
      },
    },
    {
      reportName: 'OnePlus 9 - Cybercrime Court Submission',
      reportType: 'Court Submission Report',
      caseId: case3.id,
      content: {
        officer: 'Det. Williams',
        findings: 456,
        pages: 78,
        status: 'submitted',
        sections: [
          'Case Overview',
          'Methodology',
          'Chain of Custody',
          'Technical Analysis',
          'Evidence Summary',
          'Expert Opinion',
          'Certifications'
        ],
        summary: 'Court-ready analysis of cybercrime activities including data theft and system intrusion evidence.',
        keyFindings: [
          'Evidence of unauthorized network access',
          'Stolen personal data of 1,200+ individuals',
          'Hacking tools and malware present on device',
          'Communication logs with cybercriminal networks'
        ]
      },
    },
  ];

  for (const report of reports) {
    await prisma.report.create({
      data: report,
    });
  }

  console.log('✅ Reports created');

  // Create sample devices
  const device1 = await prisma.device.create({
    data: {
      deviceName: 'Samsung Galaxy S21',
      deviceType: 'smartphone',
      imei: '358239081234567',
      phoneNumber: '+1-555-0123',
      manufacturer: 'Samsung',
      model: 'Galaxy S21',
      osVersion: 'Android 13',
      extractionDate: new Date('2024-01-15'),
      caseId: case1.id,
    },
  });

  const device2 = await prisma.device.create({
    data: {
      deviceName: 'iPhone 14 Pro',
      deviceType: 'smartphone',
      imei: '358239082345678',
      phoneNumber: '+1-555-0124',
      manufacturer: 'Apple',
      model: 'iPhone 14 Pro',
      osVersion: 'iOS 16.4',
      extractionDate: new Date('2024-01-14'),
      caseId: case2.id,
    },
  });

  const device3 = await prisma.device.create({
    data: {
      deviceName: 'OnePlus 9',
      deviceType: 'smartphone',
      imei: '358239083456789',
      phoneNumber: '+1-555-0125',
      manufacturer: 'OnePlus',
      model: 'OnePlus 9',
      osVersion: 'Android 12',
      extractionDate: new Date('2024-01-13'),
      caseId: case3.id,
    },
  });

  console.log('✅ Devices created');

  // Create sample chat data
  const sampleChats = [
    {
      platform: 'WhatsApp',
      conversationId: 'conv_001',
      participantName: 'John Dealer',
      participantNumber: '+1-555-0200',
      message: 'Package ready for pickup at the usual spot',
      timestamp: new Date('2024-01-10T14:30:00Z'),
      direction: 'incoming',
      messageType: 'text',
      isDeleted: false,
      embedding: [0.1, 0.2, 0.3],
      deviceId: device1.id,
    },
    {
      platform: 'Telegram',
      conversationId: 'conv_002',
      participantName: 'Mike Finance',
      participantNumber: '+1-555-0201',
      message: 'Transfer complete. Check your crypto wallet.',
      timestamp: new Date('2024-01-11T16:45:00Z'),
      direction: 'incoming',
      messageType: 'text',
      isDeleted: false,
      embedding: [0.4, 0.5, 0.6],
      deviceId: device2.id,
    },
    {
      platform: 'Signal',
      conversationId: 'conv_003',
      participantName: 'Anonymous',
      participantNumber: '+1-555-0202',
      message: 'Data breach successful. Files encrypted and uploaded.',
      timestamp: new Date('2024-01-12T09:15:00Z'),
      direction: 'outgoing',
      messageType: 'text',
      isDeleted: true,
      embedding: [0.7, 0.8, 0.9],
      deviceId: device3.id,
    },
  ];

  for (const chat of sampleChats) {
    await prisma.chat.create({
      data: chat,
    });
  }

  console.log('✅ Chat data created');

  // Create sample call data
  const sampleCalls = [
    {
      callType: 'outgoing',
      phoneNumber: '+1-555-0200',
      contactName: 'John Dealer',
      duration: 245,
      timestamp: new Date('2024-01-10T13:20:00Z'),
      deviceId: device1.id,
    },
    {
      callType: 'incoming',
      phoneNumber: '+1-555-0201',
      contactName: 'Mike Finance',
      duration: 180,
      timestamp: new Date('2024-01-11T15:30:00Z'),
      deviceId: device2.id,
    },
    {
      callType: 'missed',
      phoneNumber: '+1-555-0202',
      contactName: null,
      duration: 0,
      timestamp: new Date('2024-01-12T08:45:00Z'),
      deviceId: device3.id,
    },
  ];

  for (const call of sampleCalls) {
    await prisma.call.create({
      data: call,
    });
  }

  console.log('✅ Call data created');

  // Create sample contacts
  const sampleContacts = [
    {
      name: 'John Dealer',
      phoneNumbers: ['+1-555-0200', '+1-555-0300'],
      emails: ['john.dealer@darkweb.com'],
      organization: 'Street Network',
      notes: 'Primary contact for drug transactions',
      deviceId: device1.id,
    },
    {
      name: 'Mike Finance',
      phoneNumbers: ['+1-555-0201'],
      emails: ['mike.finance@crypto.net', 'alternate@finance.com'],
      organization: 'Crypto Traders',
      notes: 'Handles financial transactions and cryptocurrency',
      deviceId: device2.id,
    },
    {
      name: 'Sarah Hacker',
      phoneNumbers: ['+1-555-0202', '+1-555-0400'],
      emails: ['sarah@hacknet.org'],
      organization: 'Underground Network',
      notes: 'Technical expert, involved in data breaches',
      deviceId: device3.id,
    },
  ];

  for (const contact of sampleContacts) {
    await prisma.contact.create({
      data: contact,
    });
  }

  console.log('✅ Contact data created');

  // Create sample queries
  const sampleQueries = [
    {
      queryText: 'Show me all communications containing drug-related keywords',
      queryType: 'natural_language',
      results: {
        chats: 25,
        calls: 12,
        relevantContacts: 8
      },
      resultCount: 45,
      executionTime: 1250,
      caseId: case1.id,
    },
    {
      queryText: 'Find all financial transactions and cryptocurrency references',
      queryType: 'natural_language',
      results: {
        messages: 18,
        apps: 5,
        transactions: 23
      },
      resultCount: 46,
      executionTime: 980,
      caseId: case2.id,
    },
    {
      queryText: 'Search for hacking tools and malware evidence',
      queryType: 'natural_language',
      results: {
        files: 15,
        apps: 8,
        communications: 12
      },
      resultCount: 35,
      executionTime: 1680,
      caseId: case3.id,
    },
  ];

  for (const query of sampleQueries) {
    await prisma.query.create({
      data: query,
    });
  }

  console.log('✅ Query data created');

  // Create sample entities
  const sampleEntities = [
    {
      entityType: 'phone_number',
      value: '+1-555-0200',
      occurrences: 15,
      contexts: [
        { type: 'chat', platform: 'WhatsApp', frequency: 10 },
        { type: 'call', direction: 'outgoing', frequency: 5 }
      ],
    },
    {
      entityType: 'crypto_address',
      value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      occurrences: 8,
      contexts: [
        { type: 'chat', platform: 'Telegram', frequency: 5 },
        { type: 'app_data', app: 'Blockchain Wallet', frequency: 3 }
      ],
    },
    {
      entityType: 'email',
      value: 'john.dealer@darkweb.com',
      occurrences: 12,
      contexts: [
        { type: 'contact', name: 'John Dealer', frequency: 8 },
        { type: 'chat', platform: 'Signal', frequency: 4 }
      ],
    },
    {
      entityType: 'ip_address',
      value: '192.168.1.100',
      occurrences: 20,
      contexts: [
        { type: 'network_log', protocol: 'TCP', frequency: 15 },
        { type: 'app_data', app: 'TOR Browser', frequency: 5 }
      ],
    },
  ];

  for (const entity of sampleEntities) {
    await prisma.entity.create({
      data: entity,
    });
  }

  console.log('✅ Entity data created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log('  - 3 Cases created');
  console.log('  - 3 Reports created');
  console.log('  - 3 Devices created');
  console.log('  - 3 Chat messages created');
  console.log('  - 3 Call records created');
  console.log('  - 3 Contacts created');
  console.log('  - 3 Queries created');
  console.log('  - 4 Entities created');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generates a unique 8-digit numeric string for meiosisId.
 */
async function generateUniqueNumericId(modelName) {
  let attempts = 0;
  while (attempts < 100) {
    const newId = Math.floor(10000000 + Math.random() * 90000000).toString();
    const existing = await prisma[modelName].findUnique({
      where: { meiosisId: newId }
    });
    if (!existing) return newId;
    attempts++;
  }
  throw new Error(`Failed to generate unique numeric ID for ${modelName} after 100 attempts.`);
}

async function migrate() {
  console.log('🚀 Starting Meiosis ID Numeric Migration...');

  // 1. Migrate Patients: Set meiosisId = universalCode
  const patients = await prisma.patient.findMany({
    select: { id: true, universalCode: true, meiosisId: true }
  });
  console.log(`📋 Found ${patients.length} patients. Syncing with Universal Code...`);

  for (const patient of patients) {
    if (!patient.universalCode || !/^\d+$/.test(patient.universalCode)) {
      console.warn(`⚠️ Patient ${patient.id} has non-numeric universalCode: ${patient.universalCode}. Skipping...`);
      continue;
    }

    await prisma.$transaction([
      prisma.patient.update({
        where: { id: patient.id },
        data: { meiosisId: patient.universalCode }
      }),
      prisma.userAccount.updateMany({
        where: { patientId: patient.id },
        data: { meiosisId: patient.universalCode }
      })
    ]);
  }

  // 2. Migrate Doctors: Generate new 8-digit numeric IDs
  const doctors = await prisma.doctor.findMany({
    select: { id: true, meiosisId: true }
  });
  console.log(`📋 Found ${doctors.length} doctors. Generating new numeric IDs...`);

  for (const doctor of doctors) {
    const newNumericId = await generateUniqueNumericId('doctor');
    
    await prisma.$transaction([
      prisma.doctor.update({
        where: { id: doctor.id },
        data: { meiosisId: newNumericId }
      }),
      prisma.userAccount.updateMany({
        where: { doctorId: doctor.id },
        data: { meiosisId: newNumericId }
      })
    ]);
    console.log(`✅ Doctor ${doctor.id}: ${doctor.meiosisId} -> ${newNumericId}`);
  }

  // 3. Handle leftover UserAccounts (Admin or unlinked)
  const leftoverAccounts = await prisma.userAccount.findMany({
    where: {
      patientId: null,
      doctorId: null,
      NOT: { meiosisId: { contains: 'admin' } } // don't break mock admins if they exist
    }
  });

  if (leftoverAccounts.length > 0) {
    console.log(`📋 Found ${leftoverAccounts.length} unlinked UserAccounts. Migrating...`);
    for (const account of leftoverAccounts) {
      if (!/^\d+$/.test(account.meiosisId)) {
        const newId = await generateUniqueNumericId('userAccount');
        await prisma.userAccount.update({
          where: { id: account.id },
          data: { meiosisId: newId }
        });
      }
    }
  }

  console.log('✨ Migration complete! All Meiosis IDs are now numeric.');
}

migrate()
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

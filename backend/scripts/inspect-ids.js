const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    take: 5,
    select: { id: true, meiosisId: true, universalCode: true, name: true }
  });
  console.log('--- Patients ---');
  console.table(patients);

  const doctors = await prisma.doctor.findMany({
    take: 5,
    select: { id: true, meiosisId: true, name: true }
  });
  console.log('--- Doctors ---');
  console.table(doctors);

  const accounts = await prisma.userAccount.findMany({
    take: 5,
    select: { id: true, email: true, meiosisId: true }
  });
  console.log('--- UserAccounts ---');
  console.table(accounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());

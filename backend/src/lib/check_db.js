const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const patients = await prisma.patient.findMany();
    console.log(`Found ${patients.length} patients.`);
    const doctors = await prisma.doctor.findMany();
    console.log(`Found ${doctors.length} doctors.`);
  } catch (err) {
    console.error('DB Check Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();

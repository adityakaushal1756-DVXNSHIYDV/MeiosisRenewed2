const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const patientCount = await prisma.patient.count();
    const rxCount = await prisma.prescription.count();
    const labCount = await prisma.labReport.count();
    const doctorCount = await prisma.doctor.count();
    const linkCount = await prisma.patientDoctor.count();

    console.log('Database Status:');
    console.log(`- Patients: ${patientCount}`);
    console.log(`- Doctors: ${doctorCount}`);
    console.log(`- Prescriptions: ${rxCount}`);
    console.log(`- Lab Reports: ${labCount}`);
    console.log(`- Network Links: ${linkCount}`);

    if (patientCount > 0) {
      const p = await prisma.patient.findFirst();
      console.log('First Patient:', p.name, p.id, p.meiosisId);
    }
  } catch (e) {
    console.error('Prisma Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

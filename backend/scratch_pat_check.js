const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patientId = 'pat-demo7';
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  
  if (!patient) {
     console.log('Patient pat-demo7 NOT FOUND');
     return;
  }
  
  const links = await prisma.patientDoctor.findMany({
    where: { patientId: patient.id }
  });
  
  const rx = await prisma.prescription.findMany({
    where: { patientId: patient.id }
  });

  console.log(`Patient: ${patient.name} (${patient.id})`);
  console.log(`Links found: ${links.length}`);
  links.forEach(l => console.log(` - Doctor ID: ${l.doctorId}`));
  console.log(`Prescriptions found: ${rx.length}`);
  
  const allAccounts = await prisma.userAccount.findMany({
    where: { role: 'DOCTOR' }
  });
  console.log('Available Doctor Accounts:');
  allAccounts.forEach(a => console.log(` - ${a.name} (${a.email}), ID: ${a.id}, DoctorID: ${a.doctorId}`));
}

main().finally(() => prisma.$disconnect());

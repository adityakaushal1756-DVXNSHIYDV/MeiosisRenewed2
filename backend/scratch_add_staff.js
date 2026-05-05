const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.doctor.findFirst();
  if (!doctor) {
    console.log('No doctor found in DB.');
    return;
  }
  
  const doctorId = doctor.id;
  const staffData = {
    name: 'Aru Kaushal',
    email: 'arukaushaldemo6@gmail.com',
    password: 'password123',
    role: 'RECEPTION'
  };

  console.log(`Adding staff to doctor: ${doctor.name} (${doctorId})`);
  
  const staffCount = await prisma.staff.count();
  const meiosisId = `STF-${1000 + staffCount + 1}`;

  const createdStaff = await prisma.$transaction(async (tx) => {
    const staff = await tx.staff.create({
      data: {
        name: staffData.name,
        email: staffData.email.toLowerCase(),
        role: staffData.role,
        doctorId
      }
    });

    await tx.userAccount.create({
      data: {
        role: staffData.role,
        name: staffData.name,
        email: staffData.email.toLowerCase(),
        meiosisId,
        password: staffData.password,
        staffId: staff.id
      }
    });

    return staff;
  });

  console.log('Staff added successfully:', JSON.stringify(createdStaff, null, 2));
}

main().catch(err => {
  console.error('Failed to add staff:', err);
}).finally(() => prisma.$disconnect());

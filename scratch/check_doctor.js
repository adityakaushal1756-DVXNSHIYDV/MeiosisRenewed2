
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    select: {
      id: true,
      name: true,
      lastActiveAt: true
    }
  });
  console.log(JSON.stringify(doctors, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

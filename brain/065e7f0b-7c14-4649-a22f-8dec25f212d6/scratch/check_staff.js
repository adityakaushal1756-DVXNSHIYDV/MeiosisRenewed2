const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staff.findMany();
  console.log('--- Staff List ---');
  console.log(JSON.stringify(staff, null, 2));
  
  const accounts = await prisma.userAccount.findMany({
    where: { staffId: { not: null } }
  });
  console.log('\n--- Staff Accounts ---');
  console.log(JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

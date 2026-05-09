require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { ensureFutureAppointmentSlots } = require('../backend/src/lib/appointment-slots');

async function testSlotGen() {
  try {
    // 1. Get a doctor
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      console.log('No doctor found in DB.');
      return;
    }
    console.log(`Testing for doctor: ${doctor.name} (${doctor.id})`);

    // 2. Set a test schedule for Monday (1)
    const testSchedule = {
      doctorId: doctor.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '12:00',
      slotDuration: 30,
      isActive: true
    };

    await prisma.doctorSchedule.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorSchedule.create({ data: testSchedule });
    console.log('Test schedule created.');

    // 3. Clear future available slots for this doctor to start fresh
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.appointmentSlot.deleteMany({
      where: {
        doctorId: doctor.id,
        available: true,
        startAt: { gte: today }
      }
    });
    console.log('Cleared existing available slots.');

    // 4. Generate slots
    await ensureFutureAppointmentSlots(prisma, doctor.id);
    console.log('Slot generation triggered.');

    // 5. Verify slots
    const slots = await prisma.appointmentSlot.findMany({
      where: {
        doctorId: doctor.id,
        startAt: { gte: today }
      },
      orderBy: { startAt: 'asc' }
    });

    console.log(`Total slots found: ${slots.length}`);
    if (slots.length > 0) {
      console.log('First 3 slots:');
      slots.slice(0, 3).forEach(s => {
        console.log(`- ${s.startAt.toISOString()} to ${s.endAt.toISOString()} (${s.mode})`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSlotGen();

const { AppointmentMode, SlotStatus } = require('@prisma/client');

const DEFAULT_LOOKAHEAD_DAYS = 30;

function parseTimeParts(timeText) {
  const [hours, minutes] = (timeText || '00:00').split(':').map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0
  };
}

function setDateTime(baseDate, timeText) {
  const next = new Date(baseDate);
  const { hours, minutes } = parseTimeParts(timeText);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function rangesOverlap(startAt, endAt, breakStart, breakEnd) {
  if (!breakStart || !breakEnd) return false;
  return startAt < breakEnd && endAt > breakStart;
}

async function ensureFutureAppointmentSlots(prisma, doctorId = null, lookaheadDays = DEFAULT_LOOKAHEAD_DAYS) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(today.getDate() + lookaheadDays);

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      isActive: true,
      ...(doctorId ? { doctorId } : {})
    },
    orderBy: [
      { doctorId: 'asc' },
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });

  if (!schedules.length) return;

  const overrides = await prisma.doctorScheduleOverride.findMany({
    where: {
      ...(doctorId ? { doctorId } : {}),
      overrideDate: { gte: today, lt: rangeEnd }
    }
  });

  const overrideMap = new Map(
    overrides.map((entry) => [
      `${entry.doctorId}:${entry.overrideDate.toISOString().slice(0, 10)}`,
      entry
    ])
  );

  const doctorIds = doctorId ? [doctorId] : [...new Set(schedules.map((s) => s.doctorId))];

  // Build a map of doctorId → configured slotDuration (use the first active schedule per doctor).
  // This is what we compare existing slots against to detect stale durations.
  const configuredDuration = new Map();
  for (const s of schedules) {
    if (!configuredDuration.has(s.doctorId)) {
      configuredDuration.set(s.doctorId, Number(s.slotDuration || 30));
    }
  }

  // Fetch existing slots including their slotDuration field so we can detect mismatches.
  const existingSlots = await prisma.appointmentSlot.findMany({
    where: {
      doctorId: { in: doctorIds },
      startAt: { gte: today, lt: rangeEnd }
    },
    select: { doctorId: true, startAt: true, slotDuration: true, available: true }
  });

  // ── Stale-duration detection ──────────────────────────────────────────────
  // If any AVAILABLE future slot has a different slotDuration than what the
  // schedule currently says, delete all available slots for that doctor and
  // let the generation loop below recreate them at the correct interval.
  const staleDoctorIds = new Set();
  for (const slot of existingSlots) {
    if (!slot.available) continue; // never delete booked slots
    const configured = configuredDuration.get(slot.doctorId);
    if (configured !== undefined && Number(slot.slotDuration) !== configured) {
      staleDoctorIds.add(slot.doctorId);
    }
  }

  if (staleDoctorIds.size > 0) {
    await prisma.appointmentSlot.deleteMany({
      where: {
        doctorId: { in: [...staleDoctorIds] },
        available: true,
        startAt: { gte: today, lt: rangeEnd }
      }
    });
  }

  // Rebuild the existingSet from whatever remains (booked slots + non-stale available slots).
  const survivingSlots = existingSlots.filter(
    (s) => !staleDoctorIds.has(s.doctorId) || !s.available
  );
  const existingSet = new Set(
    survivingSlots.map((s) => `${s.doctorId}:${s.startAt.toISOString()}`)
  );

  const slotsToCreate = [];

  for (const schedule of schedules) {
    for (let offset = 0; offset < lookaheadDays; offset += 1) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + offset);
      if (currentDate.getDay() !== schedule.dayOfWeek) continue;

      const dateKey = currentDate.toISOString().slice(0, 10);
      const override = overrideMap.get(`${schedule.doctorId}:${dateKey}`);
      if (override?.isOffDay) continue;

      const effectiveStart = override?.startTime || schedule.startTime;
      const effectiveEnd = override?.endTime || schedule.endTime;
      const effectiveBreakStart = override?.breakStart ?? schedule.breakStart;
      const effectiveBreakEnd = override?.breakEnd ?? schedule.breakEnd;
      const effectiveDuration = Number(override?.slotDuration || schedule.slotDuration || 30);

      const dayStart = setDateTime(currentDate, effectiveStart);
      const dayEnd = setDateTime(currentDate, effectiveEnd);
      const breakStart = effectiveBreakStart ? setDateTime(currentDate, effectiveBreakStart) : null;
      const breakEnd = effectiveBreakEnd ? setDateTime(currentDate, effectiveBreakEnd) : null;
      const slotDuration = effectiveDuration > 0 ? effectiveDuration : 30;

      for (
        let current = new Date(dayStart);
        current < dayEnd;
        current = new Date(current.getTime() + slotDuration * 60 * 1000)
      ) {
        const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);
        if (slotEnd > dayEnd) break;
        if (rangesOverlap(current, slotEnd, breakStart, breakEnd)) continue;

        const key = `${schedule.doctorId}:${current.toISOString()}`;
        if (existingSet.has(key)) continue;

        const mode = current.getHours() >= 16 ? AppointmentMode.TELECONSULT : AppointmentMode.IN_PERSON;
        const location = mode === AppointmentMode.TELECONSULT
          ? 'Virtual Consultation Desk'
          : 'Scheduled OPD Consultation';

        slotsToCreate.push({
          doctorId: schedule.doctorId,
          scheduleId: schedule.id,
          startAt: new Date(current),
          endAt: new Date(slotEnd),
          mode,
          location,
          slotDuration,
          status: SlotStatus.AVAILABLE,
          available: true
        });

        existingSet.add(key);
      }
    }
  }

  if (slotsToCreate.length > 0) {
    await prisma.appointmentSlot.createMany({ data: slotsToCreate });
  }
}

module.exports = {
  ensureFutureAppointmentSlots,
  DEFAULT_LOOKAHEAD_DAYS
};

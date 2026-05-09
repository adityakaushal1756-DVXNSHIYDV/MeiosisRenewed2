const { AppointmentMode, SlotStatus } = require('@prisma/client');

const DEFAULT_LOOKAHEAD_DAYS = 14;

/**
 * DECOMMISSIONED: Automated slot generation has been removed.
 * This function is now a no-op to prevent runtime errors in legacy callers.
 */
async function ensureFutureAppointmentSlots(prisma, doctorId = null, lookaheadDays = DEFAULT_LOOKAHEAD_DAYS) {
  // Logic removed as per user request.
  return;
}

module.exports = {
  ensureFutureAppointmentSlots,
  DEFAULT_LOOKAHEAD_DAYS
};

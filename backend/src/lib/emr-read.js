const prisma = require('./prisma');
const { parseDurationToDays } = require('./parse-duration');

const PATIENT_EMR_SELECT = {
  id: true,
  meiosisId: true,
  universalCode: true,
  name: true,
  email: true,
  phone: true,
  bloodGroup: true,
  address: true,
  healthScore: true,
  insurancePlan: true,
  emergencyContact: true,
  createdAt: true,
  updatedAt: true,
  abhaAddress: true,
  abhaId: true,
  shareSettings: true,
  medicalStatus: true,
  admissionWard: true,
  admissionBed: true,
  admissionTime: true,
};

function computeItemIsActive(item, rxStartDate, rxDurationDays) {
  const now = new Date();
  const startDate = rxStartDate ? new Date(rxStartDate) : now;
  const itemDays =
    item.durationDays ??
    parseDurationToDays(item.timing) ??
    rxDurationDays ??
    30;
  const expiryMs = startDate.getTime() + itemDays * 24 * 60 * 60 * 1000;
  return now.getTime() <= expiryMs;
}

async function resolvePatient(patientId) {
  if (!patientId) return null;

  let patient = await prisma.patient.findUnique({
    where: { id: String(patientId) },
    select: PATIENT_EMR_SELECT,
  }).catch(() => null);
  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { meiosisId: String(patientId) },
          { universalCode: String(patientId) },
        ],
      },
      select: PATIENT_EMR_SELECT,
    });
  }

  return patient;
}

function accessLevelFromShareSettings(shareSettings) {
  const settings = shareSettings && typeof shareSettings === 'object' ? shareSettings : {};
  if (settings.fullAccess === true) return 'full';
  if (settings.labOnly === true) return 'lab';
  if (settings.summaryOnly === true) return 'summary';
  return 'full';
}

async function getLinkedDoctorAccessLevel({ patient, doctorId }) {
  if (!patient?.id || !doctorId) return null;

  const link = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: patient.id, doctorId } },
  });
  if (!link) return null;

  return accessLevelFromShareSettings(patient.shareSettings);
}

async function buildPatientEmrPayload({ patient, accessLevel = 'full' }) {
  const [prescriptions, labReports, appointments, hpNotes] = await Promise.all([
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: true, items: accessLevel !== 'lab' },
      orderBy: { startDate: 'desc' },
    }),
    prisma.labReport.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { reportDate: 'desc' },
    }),
    prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { scheduledDate: 'desc' },
    }),
    prisma.hPNote.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { noteDate: 'desc' },
    }).catch(() => []),
  ]);

  let prescriptionsOut = prescriptions;
  if (accessLevel === 'lab') {
    prescriptionsOut = [];
  } else if (accessLevel === 'summary') {
    prescriptionsOut = prescriptions.map((rx) => ({
      ...rx,
      doctorNote: null,
      items: [],
    }));
  }

  prescriptionsOut = prescriptionsOut.map((rx) => {
    const enrichedItems = (rx.items || []).map((item) => ({
      ...item,
      isActive: computeItemIsActive(item, rx.startDate, rx.durationDays),
    }));

    const rxIsActive = enrichedItems.length > 0
      ? enrichedItems.some((item) => item.isActive)
      : computeItemIsActive({ durationDays: null }, rx.startDate, rx.durationDays);

    return { ...rx, items: enrichedItems, isActive: rxIsActive };
  });

  return {
    patient,
    prescriptions: prescriptionsOut,
    labReports,
    appointments,
    hpNotes,
    accessLevel,
  };
}

module.exports = {
  accessLevelFromShareSettings,
  buildPatientEmrPayload,
  computeItemIsActive,
  getLinkedDoctorAccessLevel,
  resolvePatient,
};

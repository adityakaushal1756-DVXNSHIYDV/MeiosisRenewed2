-- PostgreSQL schema for the persistent doctor-patient relationship table.
-- This is intentionally persistent. Temporary QR access is stateless and must
-- not create rows here.

CREATE TABLE IF NOT EXISTS doctor_patient_links (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES "Patient"(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES "Doctor"(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT doctor_patient_links_patient_doctor_unique UNIQUE (patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS doctor_patient_links_patient_id_idx
  ON doctor_patient_links(patient_id);

CREATE INDEX IF NOT EXISTS doctor_patient_links_doctor_id_idx
  ON doctor_patient_links(doctor_id);

-- Optional one-time data carry-forward for databases that already have Prisma's
-- previous implicit "PatientDoctor" table.
DO $$
BEGIN
  IF to_regclass('"PatientDoctor"') IS NOT NULL THEN
    INSERT INTO doctor_patient_links (id, patient_id, doctor_id, linked_at)
    SELECT id, "patientId", "doctorId", "linkedAt"
    FROM "PatientDoctor"
    ON CONFLICT (patient_id, doctor_id) DO NOTHING;
  END IF;
END $$;

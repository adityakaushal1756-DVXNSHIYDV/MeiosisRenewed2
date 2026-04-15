# MEIOSIS Backend

Local backend for the patient portal using:

- `Express`
- `Prisma`
- `Supabase Postgres`

This is intentionally seeded with temporary test data so you can replace it later with real patient, doctor, slot, prescription, and message data.

## Included modules

- patient profile
- doctor directory
- doctor slots
- appointments
- appointment queue + refund logic
- prescriptions
- lab reports
- message threads
- EMR share transactions

## Setup

1. Copy env file:

```powershell
Copy-Item .env.example .env
```

2. Install packages:

```powershell
npm install
```

3. Create database:

```powershell
npx prisma db push
```

4. Seed test data:

```powershell
npm run seed
```

5. Start backend:

```powershell
npm run dev
```

Backend will run on:

`https://meiosisfrontendtest1.onrender.com/`

## Main endpoints

- `GET /health`
- `GET /api/patient/profile`
- `GET /api/doctors`
- `GET /api/doctors/:doctorId/slots`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:appointmentId`
- `GET /api/prescriptions`
- `GET /api/prescriptions/:prescriptionId`
- `GET /api/labs`
- `GET /api/messages/threads`
- `POST /api/messages/threads/:threadId/messages`
- `GET /api/emr-shares`
- `POST /api/emr-shares`

## Notes

- Supabase Postgres is used as the primary database.
- If your database password contains special characters like `@`, encode them in the URL. Example: `@` becomes `%40`.
- Appointment booking now uses:
  - real slot locking in `DoctorSlot`
  - queue row creation in `AppointmentQueue`
  - mock payment capture (`Mock Payment`)
  - refund eligibility on cancellation before the 6-hour cutoff
- The seeded doctor IDs match the frontend mock flows:
  - `doc-001`
  - `doc-002`
  - `doc-003`

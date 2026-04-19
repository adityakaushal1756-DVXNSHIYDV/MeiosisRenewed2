const { PrismaClient } = require('@prisma/client');
const { ensureFutureAppointmentSlots } = require('../src/lib/appointment-slots');

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labReport.deleteMany();
  await prisma.appointmentQueue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctorScheduleOverride.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.emrShare.deleteMany();
  await prisma.patientDoctor.deleteMany(); // network links
  await prisma.userAccount.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();

  const patient = await prisma.patient.create({
    data: {
      meiosisId: 'PAT-001',
      universalCode: '48291374',
      name: 'Aditya Sharma',
      email: 'aditya.sharma@example.com',
      phone: '+91-98XXXXXX10',
      bloodGroup: 'B+',
      address: 'Bengaluru, Karnataka',
      healthScore: 87,
      insurancePlan: 'MediSure Gold',
      emergencyContact: 'Priya Sharma (+91-98XXXXXX10)'
    }
  });

  // ── Remaining 19 mock patients (must match universalCode in doctor-frontend/src/mock/mockPatients.ts) ──
  const otherPatientData = [
    { meiosisId: 'PAT-002', universalCode: '12345677', name: 'Nikita Mehra',    email: 'nikita.mehra@example.com',    phone: '+91 98220 44556', bloodGroup: 'A+' },
    { meiosisId: 'PAT-003', universalCode: '12345666', name: 'Rahul Verma',     email: 'rahul.verma@example.com',     phone: '+91 98990 11223', bloodGroup: 'O+' },
    { meiosisId: 'PAT-004', universalCode: '12345665', name: 'Sneha Iyer',      email: 'sneha.iyer@example.com',      phone: '+91 98765 11111', bloodGroup: 'B+' },
    { meiosisId: 'PAT-005', universalCode: '12345664', name: 'Siddharth Rao',   email: 'siddharth.rao@example.com',   phone: '+91 98000 44444', bloodGroup: 'AB+' },
    { meiosisId: 'PAT-006', universalCode: '12345663', name: 'Aarav Bhatia',    email: 'aarav.bhatia@example.com',    phone: '+91 98123 45000', bloodGroup: 'O-' },
    { meiosisId: 'PAT-007', universalCode: '12345662', name: 'Meera Nair',      email: 'meera.nair@example.com',      phone: '+91 98123 45001', bloodGroup: 'A-' },
    { meiosisId: 'PAT-008', universalCode: '12345661', name: 'Arjun Kapoor',    email: 'arjun.kapoor@example.com',    phone: '+91 98123 45002', bloodGroup: 'B+' },
    { meiosisId: 'PAT-009', universalCode: '12345660', name: 'Pooja Singh',     email: 'pooja.singh@example.com',     phone: '+91 98123 45003', bloodGroup: 'O+' },
    { meiosisId: 'PAT-010', universalCode: '12345659', name: 'Rohan Sethi',     email: 'rohan.sethi@example.com',     phone: '+91 98123 45004', bloodGroup: 'A+' },
    { meiosisId: 'PAT-011', universalCode: '12345658', name: 'Lavanya Reddy',   email: 'lavanya.reddy@example.com',   phone: '+91 98123 45005', bloodGroup: 'B-' },
    { meiosisId: 'PAT-012', universalCode: '12345657', name: 'Vikram Joshi',    email: 'vikram.joshi@example.com',    phone: '+91 98123 45006', bloodGroup: 'AB+' },
    { meiosisId: 'PAT-013', universalCode: '12345656', name: 'Ananya Bose',     email: 'ananya.bose@example.com',     phone: '+91 98123 45007', bloodGroup: 'O+' },
    { meiosisId: 'PAT-014', universalCode: '12345655', name: 'Dev Malhotra',    email: 'dev.malhotra@example.com',    phone: '+91 98123 45008', bloodGroup: 'A+' },
    { meiosisId: 'PAT-015', universalCode: '12345654', name: 'Tanya Chawla',    email: 'tanya.chawla@example.com',    phone: '+91 98123 45009', bloodGroup: 'B+' },
    { meiosisId: 'PAT-016', universalCode: '12345653', name: 'Kunal Mehta',     email: 'kunal.mehta@example.com',     phone: '+91 98123 45010', bloodGroup: 'O+' },
    { meiosisId: 'PAT-017', universalCode: '12345652', name: 'Isha Anand',      email: 'isha.anand@example.com',      phone: '+91 98123 45011', bloodGroup: 'A+' },
    { meiosisId: 'PAT-018', universalCode: '12345651', name: 'Pranav Kulkarni', email: 'pranav.kulkarni@example.com', phone: '+91 98123 45012', bloodGroup: 'B+' },
    { meiosisId: 'PAT-019', universalCode: '12345650', name: 'Sanya Khurana',   email: 'sanya.khurana@example.com',   phone: '+91 98123 45013', bloodGroup: 'O-' },
    { meiosisId: 'PAT-020', universalCode: '12345649', name: 'Harsh Dubey',     email: 'harsh.dubey@example.com',     phone: '+91 98123 45014', bloodGroup: 'AB-' },
  ];

  await Promise.all(
    otherPatientData.map(p =>
      prisma.patient.create({
        data: {
          meiosisId:        p.meiosisId,
          universalCode:    p.universalCode,
          name:             p.name,
          email:            p.email,
          phone:            p.phone,
          bloodGroup:       p.bloodGroup,
          address:          'India',
          healthScore:      75,
          insurancePlan:    'Basic Cover',
          emergencyContact: 'On file'
        }
      })
    )
  );

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        id: 'doc-001',
        meiosisId: 'M-001',
        name: 'Dr. Sarah Mitchell',
        specialty: 'Primary Care',
        hospital: 'City General',
        consultFee: 800,
        rating: 4.8,
        workingHours: 'Mon-Sat | 09:00 AM - 01:00 PM'
      }
    }),
    prisma.doctor.create({
      data: {
        id: 'doc-002',
        meiosisId: 'M-002',
        name: 'Dr. Arjun Rao',
        specialty: 'Cardiology',
        hospital: 'City General',
        consultFee: 1200,
        rating: 4.9,
        workingHours: 'Mon-Fri | 10:30 AM - 04:30 PM'
      }
    }),
    prisma.doctor.create({
      data: {
        id: 'doc-003',
        meiosisId: 'M-003',
        name: 'Dr. Emily Chen',
        specialty: 'Endocrinology',
        hospital: 'Nova Endocrine Care',
        consultFee: 1100,
        rating: 4.7,
        workingHours: 'Tue-Sat | 11:00 AM - 05:00 PM'
      }
    }),
    prisma.doctor.create({
      data: {
        id: 'doc-pablo',
        meiosisId: 'M-PABLO',
        name: 'Dr. Pablo Escobar',
        specialty: 'Clinical Intelligence',
        hospital: 'Medellin Health',
        consultFee: 2000,
        rating: 5.0,
        workingHours: 'Mon-Sun | 24/7'
      }
    }),
    prisma.doctor.create({
      data: {
        id: 'doc-jill',
        meiosisId: 'M-JILL',
        name: 'Dr. Jill Valentine',
        specialty: 'Virology',
        hospital: 'Raccoon City Hospital',
        consultFee: 1500,
        rating: 4.9,
        workingHours: 'Mon-Fri | 08:00 AM - 04:00 PM'
      }
    })
  ]);

  const [primaryDoctor, cardioDoctor, endoDoctor, pabloDoctor, jillDoctor] = doctors;

  async function createSchedule(doctorId, dayOfWeek, startTime, endTime, slotDuration, breakStart, breakEnd) {
    return prisma.doctorSchedule.create({
      data: { doctorId, dayOfWeek, startTime, endTime, slotDuration, breakStart, breakEnd, isActive: true }
    });
  }

  await Promise.all([
    createSchedule(primaryDoctor.id, 1, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(primaryDoctor.id, 2, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(primaryDoctor.id, 3, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(primaryDoctor.id, 4, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(primaryDoctor.id, 5, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(primaryDoctor.id, 6, '09:00', '13:00', 30, '11:00', '11:20'),
    createSchedule(cardioDoctor.id, 1, '10:30', '16:30', 20, '13:30', '14:00'),
    createSchedule(cardioDoctor.id, 2, '10:30', '16:30', 20, '13:30', '14:00'),
    createSchedule(cardioDoctor.id, 3, '10:30', '16:30', 20, '13:30', '14:00'),
    createSchedule(cardioDoctor.id, 4, '10:30', '16:30', 20, '13:30', '14:00'),
    createSchedule(cardioDoctor.id, 5, '10:30', '16:30', 20, '13:30', '14:00'),
    createSchedule(endoDoctor.id, 2, '11:00', '17:00', 30, '14:00', '14:20'),
    createSchedule(endoDoctor.id, 3, '11:00', '17:00', 30, '14:00', '14:20'),
    createSchedule(endoDoctor.id, 4, '11:00', '17:00', 30, '14:00', '14:20'),
    createSchedule(endoDoctor.id, 5, '11:00', '17:00', 30, '14:00', '14:20'),
    createSchedule(endoDoctor.id, 6, '11:00', '17:00', 30, '14:00', '14:20'),
    // Schedules for Pablo and Jill
    createSchedule(pabloDoctor.id, 1, '09:00', '21:00', 15, '13:00', '14:00'),
    createSchedule(jillDoctor.id, 1, '08:00', '16:00', 20, '12:00', '13:00'),
  ]);


  await prisma.doctorScheduleOverride.createMany({
    data: [
      {
        doctorId: primaryDoctor.id,
        overrideDate: new Date('2026-03-20T00:00:00.000Z'),
        isOffDay: true,
        note: 'Conference leave'
      },
      {
        doctorId: cardioDoctor.id,
        overrideDate: new Date('2026-03-18T00:00:00.000Z'),
        isOffDay: false,
        startTime: '12:00',
        endTime: '16:30',
        slotDuration: 20,
        breakStart: '14:00',
        breakEnd: '14:20',
        note: 'Late OPD start'
      }
    ]
  });

  await ensureFutureAppointmentSlots(prisma);


  await prisma.userAccount.createMany({
    data: [
      {
        role: 'PATIENT',
        name: patient.name,
        email: patient.email,
        meiosisId: patient.meiosisId,
        password: 'demo1234',
        patientId: patient.id
      },
      {
        role: 'DOCTOR',
        name: primaryDoctor.name,
        email: 'sarah.mitchell@meiosis.health',
        meiosisId: primaryDoctor.meiosisId,
        password: 'demo1234',
        doctorId: primaryDoctor.id
      },
      {
        role: 'DOCTOR',
        name: cardioDoctor.name,
        email: 'arjun.rao@meiosis.health',
        meiosisId: cardioDoctor.meiosisId,
        password: 'demo1234',
        doctorId: cardioDoctor.id
      },
      {
        role: 'DOCTOR',
        name: endoDoctor.name,
        email: 'emily.chen@meiosis.health',
        meiosisId: endoDoctor.meiosisId,
        password: 'demo1234',
        doctorId: endoDoctor.id
      },
      {
        role: 'DOCTOR',
        name: pabloDoctor.name,
        email: 'pablo.escobar@meiosis.health',
        meiosisId: pabloDoctor.meiosisId,
        password: 'demo1234',
        doctorId: pabloDoctor.id
      },
      {
        role: 'DOCTOR',
        name: jillDoctor.name,
        email: 'jill.valentine@meiosis.health',
        meiosisId: jillDoctor.meiosisId,
        password: 'demo1234',
        doctorId: jillDoctor.id
      }
    ]
  });

  /* ─────────────────────────────────────────────────────────────
     DEEP DIAGNOSTIC DATA: Historical Records & Messages
  ───────────────────────────────────────────────────────────── */
  console.log('--- Generating Deep Diagnostic Data ---');
  
  const historyDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  // Create Message threads and welcome messages
  const threads = await Promise.all(doctors.map(doc => 
    prisma.messageThread.create({
      data: {
        doctorId: doc.id,
        patientId: patient.id,
        messages: {
          create: [
            { sender: 'DOCTOR', text: `Hello ${patient.name}, I am Dr. ${doc.name}. Welcome to MEIOSIS. How can I assist you today?`, createdAt: historyDate(10) },
            { sender: 'PATIENT', text: 'Thank you doctor. I wanted to check my recent reports.', createdAt: historyDate(9) }
          ]
        }
      }
    })
  ));


  // Custom Demo Accounts requested by user
  console.log('--- Seeding Custom User Demo Accounts ---');
  const demoPassword = '1003531935';

  const demoDoctor = await prisma.doctor.create({
    data: {
      id: 'doc-demo6',
      meiosisId: 'M-DEMO6',
      name: 'Dr. Aditya (Demo)',
      specialty: 'Clinical Excellence',
      hospital: 'MEIOSIS Headquarters',
      consultFee: 1000,
      rating: 5.0,
      workingHours: 'Mon-Sun | 24/7',
      email: 'adityakaushaldemo6@gmail.com'
    }
  });

  const demoDoctor10 = await prisma.doctor.create({
    data: {
      id: 'doc-demo10',
      meiosisId: 'M-DEMO10',
      name: 'Dr. Aditya (Demo 10)',
      specialty: 'Diagnostic Intelligence',
      hospital: 'MEIOSIS Innovation Hub',
      consultFee: 1200,
      rating: 5.0,
      workingHours: 'Mon-Sat | 10:00 AM - 06:00 PM',
      email: 'adityakaushaldemo10@gmail.com'
    }
  });

  const demoPatient = await prisma.patient.create({
    data: {
      id: 'pat-demo7',
      meiosisId: 'PAT-DEMO7',
      name: 'Aditya Demo 7',
      email: 'adityakaushaldemo7@gmail.com',
      universalCode: '99999999',
      phone: '+91-9999999999',
      bloodGroup: 'O+',
      address: 'Cloud City',
      healthScore: 90,
      insurancePlan: 'Premium MEIOSIS Care',
      emergencyContact: 'Family'
    }
  });

  const demoPatient8 = await prisma.patient.create({
    data: {
      id: 'pat-demo8',
      meiosisId: 'PAT-DEMO8',
      name: 'Aditya Demo 8',
      email: 'adityakaushaldemo8@gmail.com',
      universalCode: '99999998',
      phone: '+91-9999999998',
      bloodGroup: 'A+',
      address: 'Cloud City Sector 8',
      healthScore: 85,
      insurancePlan: 'Standard MEIOSIS Care',
      emergencyContact: 'Family'
    }
  });

  const demoPatient9 = await prisma.patient.create({
    data: {
      id: 'pat-demo9',
      meiosisId: 'PAT-DEMO9',
      name: 'Aditya Demo 9',
      email: 'adityakaushaldemo9@gmail.com',
      universalCode: '99999997',
      phone: '+91-9999999997',
      bloodGroup: 'B-',
      address: 'Cloud City Sector 9',
      healthScore: 82,
      insurancePlan: 'Basic MEIOSIS Care',
      emergencyContact: 'On file'
    }
  });

  // Additional batch of demo patients requested: 12, 13, 14, 15
  const extraDemoPatients = await Promise.all([12, 13, 14, 15].map(x => 
    prisma.patient.create({
      data: {
        id: `pat-demo${x}`,
        meiosisId: `PAT-DEMO${x}`,
        name: `Aditya Demo ${x}`,
        email: `adityakaushaldemo${x}@gmail.com`,
        universalCode: `999990${x}`,
        phone: `+91-99999990${x}`,
        bloodGroup: 'O+',
        address: 'Cloud City',
        healthScore: 80,
        insurancePlan: 'Standard MEIOSIS Care',
        emergencyContact: 'Family'
      }
    })
  ));

  await prisma.userAccount.createMany({
    data: [
      {
        role: 'DOCTOR',
        name: demoDoctor.name,
        email: demoDoctor.email,
        meiosisId: demoDoctor.meiosisId,
        password: demoPassword,
        doctorId: demoDoctor.id
      },
      {
        role: 'DOCTOR',
        name: demoDoctor10.name,
        email: demoDoctor10.email,
        meiosisId: demoDoctor10.meiosisId,
        password: demoPassword,
        doctorId: demoDoctor10.id
      },
      {
        role: 'PATIENT',
        name: demoPatient.name,
        email: demoPatient.email,
        meiosisId: demoPatient.meiosisId,
        password: demoPassword,
        patientId: demoPatient.id
      },
      {
        role: 'PATIENT',
        name: demoPatient8.name,
        email: demoPatient8.email,
        meiosisId: demoPatient8.meiosisId,
        password: demoPassword,
        patientId: demoPatient8.id
      },
      {
        role: 'PATIENT',
        name: demoPatient9.name,
        email: demoPatient9.email,
        meiosisId: demoPatient9.meiosisId,
        password: demoPassword,
        patientId: demoPatient9.id
      },
      ...extraDemoPatients.map(p => ({
        role: 'PATIENT',
        name: p.name,
        email: p.email,
        meiosisId: p.meiosisId,
        password: demoPassword,
        patientId: p.id
      }))
    ]
  });
  // NOTE: No PatientDoctor link created — demo accounts start UNLINKED.
  // The user must connect them via the Doctor Network UI.

  // 1. Create a Schedule for the Demo Doctor 6
  const demoSchedule6 = await prisma.doctorSchedule.create({
    data: {
      doctorId: demoDoctor.id,
      dayOfWeek: new Date().getDay(), // Active today
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 15,
      isActive: true
    }
  });

  // 1b. Create a Schedule for Demo Doctor 10
  await prisma.doctorSchedule.create({
    data: {
      doctorId: demoDoctor10.id,
      dayOfWeek: new Date().getDay(),
      startTime: '10:00',
      endTime: '18:00',
      slotDuration: 15,
      isActive: true
    }
  });

  // --- NETWORK LINKS for Demo Accounts ---
  // Aditya Demo 7 -> Dr. Aditya (Demo 6)
  await prisma.patientDoctor.upsert({
    where: { patientId_doctorId: { patientId: demoPatient.id, doctorId: demoDoctor.id } },
    create: { patientId: demoPatient.id, doctorId: demoDoctor.id },
    update: {},
  });

  // Aditya Demo 8 -> Dr. Aditya (Demo 6) 
  await prisma.patientDoctor.upsert({
    where: { patientId_doctorId: { patientId: demoPatient8.id, doctorId: demoDoctor.id } },
    create: { patientId: demoPatient8.id, doctorId: demoDoctor.id },
    update: {},
  });

  // Aditya Demo 9 -> Dr. Aditya (Demo 10)
  await prisma.patientDoctor.upsert({
    where: { patientId_doctorId: { patientId: demoPatient9.id, doctorId: demoDoctor10.id } },
    create: { patientId: demoPatient9.id, doctorId: demoDoctor10.id },
    update: {},
  });


  console.log('--- Seeding Completed Successfully ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

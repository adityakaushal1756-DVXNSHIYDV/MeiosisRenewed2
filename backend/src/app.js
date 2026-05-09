const path = require('path');
const express = require('express');
const cors = require('cors');
const { uploadsRoot } = require('./lib/storage-paths');

const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const labRoutes = require('./routes/labs');
const messageRoutes = require('./routes/messages');
const shareRoutes = require('./routes/shares');
const authRoutes = require('./routes/auth');
const emrRoutes = require('./routes/emr');
const otpRoutes = require('./routes/otp');
const analyticsRoutes = require('./routes/analytics');
const extractRoutes = require('./routes/extract');
const networkRoutes = require('./routes/network');
const queueRoutes = require('./routes/queue');
const gatewayRoutes = require('./routes/gateway');
const staffRoutes = require('./routes/staff');
const hpNotesRoutes = require('./routes/hp-notes');
const auditRoutes = require('./routes/audit');
const { getDatabaseErrorPayload, isDatabaseUnavailableError } = require('./lib/database-errors');
const { authMiddleware } = require('./middleware/auth-middleware');

const fs = require('fs');
const app = express();
app.set('trust proxy', 1); // Trust Vercel proxy
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow if no origin (e.g. server-to-server or mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Allow explicit origins from env var
    if (corsOrigins.some(allowed => origin === allowed)) {
      return callback(null, true);
    }

    // 3. Allow localhost/local network
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (isLocal) {
      return callback(null, true);
    }

    // 4. Allow Vercel preview/production URLs
    const isVercel = /\.vercel\.app$/.test(origin);
    if (isVercel) {
      return callback(null, true);
    }

    // Fallback: allow for now to ensure connectivity as requested
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

// Serve Frontend Static Files (for ngrok/Monolith deployment)
const ROOT_DIR = path.resolve(__dirname, '../../');
const DOCTOR_DIST = path.join(ROOT_DIR, 'doctor-frontend/dist');
const STAFF_DIST = path.join(DOCTOR_DIST, 'staff-frontend');
const COMPANION_DIST = path.join(DOCTOR_DIST, 'companion-app');

app.use(express.static(DOCTOR_DIST));
app.use('/patient-frontend', express.static(path.join(DOCTOR_DIST, 'patient-frontend')));
app.use('/staff-frontend', express.static(path.join(DOCTOR_DIST, 'staff-frontend')));
app.use('/companion-app', express.static(path.join(DOCTOR_DIST, 'companion-app')));

// Serve Unified Gateway files from Root
app.get('/login.html', (req, res) => res.sendFile(path.join(ROOT_DIR, 'login.html')));
app.get('/auth.js', (req, res) => res.sendFile(path.join(ROOT_DIR, 'auth.js')));
app.get('/auth.css', (req, res) => res.sendFile(path.join(ROOT_DIR, 'auth.css')));
app.get('/config.js', (req, res) => res.sendFile(path.join(ROOT_DIR, 'config.js')));
app.get('/staff-login.html', (req, res) => res.sendFile(path.join(ROOT_DIR, 'staff-login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(ROOT_DIR, 'signup.html')));

const prisma = require('./lib/prisma');

app.get('/health', async (req, res) => {
  const basePayload = {
    service: "meiosis-backend",
    server: "up",
    time: new Date().toISOString()
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ...basePayload,
      ok: true,
      database: "connected",
    });
  } catch (err) {
    const payload = getDatabaseErrorPayload(err);
    if (payload) {
      return res.json({
        ...basePayload,
        ok: true,
        database: "degraded",
        warning: payload.error,
      });
    }

    res.status(500).json({
      ...basePayload,
      ok: false,
      database: "error",
      error: err.message
    });
  }
});

// Create a main router to encapsulate all API logic.
// This allows us to mount it both at /api (for local dev) and / (for Vercel serverless functions
// where the rewrite might strip the /api prefix before it hits the Express app).
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/otp', otpRoutes);
apiRouter.use('/gateway', gatewayRoutes);

// Protected Routes
apiRouter.use('/patient', authMiddleware, patientRoutes);
apiRouter.use('/patients', authMiddleware, patientRoutes);
apiRouter.use('/doctors', authMiddleware, doctorRoutes);
apiRouter.use('/appointments', authMiddleware, appointmentRoutes);
apiRouter.use('/prescriptions', authMiddleware, prescriptionRoutes);
apiRouter.use('/labs', authMiddleware, labRoutes);
apiRouter.use('/messages', authMiddleware, messageRoutes);
apiRouter.use('/emr-shares', authMiddleware, shareRoutes);
apiRouter.use('/emr', authMiddleware, emrRoutes);
apiRouter.use('/analytics', authMiddleware, analyticsRoutes);
apiRouter.use('/extract', authMiddleware, extractRoutes);
apiRouter.use('/network', authMiddleware, networkRoutes);
apiRouter.use('/queue', authMiddleware, queueRoutes);
apiRouter.use('/staff', authMiddleware, staffRoutes);
apiRouter.use('/hp-notes', authMiddleware, hpNotesRoutes);
apiRouter.use('/audit', authMiddleware, auditRoutes);

// Helper for root path behavior on serverless functions.
// If someone hits /api/ directly (common in tests/health checks), return a status.
apiRouter.get('/', (req, res) => {
  res.json({ status: "API is active", path: req.baseUrl });
});

// Mount the router at BOTH /api and / to be absolutely safe on Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);


app.get('/patient-record', (_req, res) => {
  const scanPath = path.join(DOCTOR_DIST, 'scan.html');
  if (fs.existsSync(scanPath)) {
    return res.sendFile(scanPath);
  }
  res.sendFile(path.join(__dirname, '../public/scan.html'));
});

// Catch-all for Frontend Routing (React Router)
app.get('/doctor-frontend*', (req, res) => {
  res.sendFile(path.join(DOCTOR_DIST, 'index.html'));
});

app.get('/patient-frontend*', (req, res) => {
  res.sendFile(path.join(DOCTOR_DIST, 'patient-frontend/index.html'));
});

app.get('/staff-frontend*', (req, res) => {
  res.sendFile(path.join(DOCTOR_DIST, 'staff-frontend/index.html'));
});

app.get('/companion-app*', (req, res) => {
  res.sendFile(path.join(DOCTOR_DIST, 'companion-app/index.html'));
});

// Default to login.html if nothing else matches
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const loginPath = path.join(DOCTOR_DIST, 'login.html');
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    next();
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const payload = getDatabaseErrorPayload(err);
  if (payload) {
    return res.status(payload.status).json({
      error: payload.error,
      database: isDatabaseUnavailableError(err) ? 'unavailable' : undefined,
    });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;

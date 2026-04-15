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
const { getDatabaseErrorPayload, isDatabaseUnavailableError } = require('./lib/database-errors');

const app = express();
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

apiRouter.use('/patient', patientRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/prescriptions', prescriptionRoutes);
apiRouter.use('/labs', labRoutes);
apiRouter.use('/messages', messageRoutes);
apiRouter.use('/emr-shares', shareRoutes);
apiRouter.use('/emr', emrRoutes);
apiRouter.use('/otp', otpRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/extract', extractRoutes);

// Helper for root path behavior on serverless functions.
// If someone hits /api/ directly (common in tests/health checks), return a status.
apiRouter.get('/', (req, res) => {
  res.json({ status: "API is active", path: req.baseUrl });
});

// Mount the router at BOTH /api and / to be absolutely safe on Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);


app.get('/patient-record', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/scan.html'));
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

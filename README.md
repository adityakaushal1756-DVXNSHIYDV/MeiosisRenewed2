# MEIOSIS - Doctor Dashboard & Patient Portal

A unified healthcare EMR (Electronic Medical Record) system with doctor dashboard and patient portal.

## 🚀 Quick Start

### For Local Development (Same Device)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd doctor-frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

**See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.**

---

## 📁 Project Structure

```
Meiosis Trial 8/
├── backend/                    # Express.js backend server (port 5000)
│   ├── src/
│   │   ├── app.js             # Express app configuration (CORS setup)
│   │   ├── server.js          # Server entry point
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   └── lib/               # Utilities (storage, prisma, etc)
│   ├── prisma/                # Database schema & migrations
│   ├── uploads/               # User uploads (prescriptions, labs, etc)
│   ├── package.json           # Dependencies
│   └── .env.local             # Backend configuration (local dev)
│
├── doctor-frontend/           # React + TypeScript (port 5173)
│   ├── src/
│   │   ├── App.tsx            # Main React app
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/api.ts         # API client & URL detection
│   │   └── config/            # Configuration
│   ├── vite.config.ts         # Vite bundler config (PWA setup)
│   ├── package.json           # Dependencies
│   └── .env.local             # Frontend configuration (local dev)
│
├── app.js                      # Patient portal (vanilla JS)
├── auth.js                     # Authentication handler
├── login.html                  # Login page
├── signup.html                 # Sign-up page
├── index.html                  # Patient dashboard
│
├── stt-sidecar/               # Speech-to-text service (Python)
├── mock-docs/                 # Sample documents
│
├── QUICK_START.md             # Quick start guide ⭐ START HERE
├── DEPLOYMENT_GUIDE.md        # Production deployment guide
└── README.md                  # This file
```

---

## 🔑 Key Features

- **Doctor Dashboard** - Doctor-specific interface for patient management
- **Patient Portal** - Patient-facing health records & appointment management
- **EMR System** - Electronic Medical Records with document uploads
- **Real-time Messaging** - Doctor-patient communication
- **Offline Support** - PWA with offline functionality
- **Multi-device Support** - Works on laptops, tablets, mobile
- **CORS Configured** - Works across devices and networks

---

## 🛠 Technology Stack

### Backend
- **Node.js + Express** - REST API server
- **Prisma** - Database ORM
- **PostgreSQL** - Database (Supabase optional)
- **Multer** - File uploads
- **CORS** - Cross-origin support

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **PWA** - Offline support with service workers

### Authentication
- **JWT-based** - Token authentication in routes
- **Session storage** - Client-side session management

---

## 📝 Configuration

### Environment Variables

**Backend** (`.env.local`):
```
PORT=5000
DATABASE_URL=<postgres-url>
GEMINI_API_KEY=<your-key>
SARVAM_API_KEY=<your-key>
CORS_ORIGINS=  # Empty for localhost, set for other devices
```

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=  # Empty for localhost:5000, set for other devices
```

See `.env.example` files for full documentation.

---

## 🚢 Deployment

### Local Network (Different Device)
1. Find backend machine IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Set `VITE_API_BASE_URL=http://[IP]:5000` on frontend
3. Set `CORS_ORIGINS=http://[Frontend-IP]:5173` on backend

### Vercel (Production)
1. Deploy backend to Vercel → get URL
2. Deploy frontend to Vercel with `VITE_API_BASE_URL=<backend-url>`
3. Set `CORS_ORIGINS=<frontend-url>` on backend

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed steps.**

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Patient login
- `POST /api/auth/signup` - Patient registration
- `POST /api/otp/*` - OTP management

### Patient Data
- `GET /api/patient/:id` - Patient details
- `GET /api/patient/:id/appointments` - Appointments
- `GET /api/patient/:id/prescriptions` - Prescriptions
- `GET /api/patient/:id/labs` - Lab reports

### Doctor Data
- `GET /api/doctors/:id` - Doctor profile
- `GET /api/appointments` - Appointment management
- `GET /api/emr` - EMR records

### Health Check
- `GET /health` - Server status

Full API documentation in backend routes files.

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Kill process and retry
npm run dev
```

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` in `.env.local`
- Verify backend is running: `curl http://localhost:5000/health`
- Check browser console for CORS errors
- On network: ping backend IP from frontend machine

### Module not found
```bash
cd backend && npm install
cd ../doctor-frontend && npm install
```

### Database connection error
- Update `DATABASE_URL` in `.env.local` with valid connection string
- Or run without database for UI testing

---

## 📚 Development

### Running Tests
```bash
# TODO: Add test scripts
```

### Code Style
- TypeScript for frontend
- ESLint + Prettier configured
- See `.vscode/settings.json` for auto-formatting

### VS Code Setup
Recommended extensions automatically suggested. Install with:
```
Extensions → Recommended
```

---

## 📖 Documentation

- [QUICK_START.md](QUICK_START.md) - Setup guide for new devices
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- Backend: `backend/README.md` (if exists)
- Frontend: `doctor-frontend/README.md` (if exists)

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "feat: description"`
4. Push and create PR

---

## 📄 License

[Add your license here]

---

## ❓ Questions?

Check the documentation files above first. Common issues:
- Local development issues → [QUICK_START.md](QUICK_START.md)
- Multi-device/production setup → [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Not working? → Troubleshooting section above

---

**Last Updated:** April 2026  
**Status:** Active Development ✅

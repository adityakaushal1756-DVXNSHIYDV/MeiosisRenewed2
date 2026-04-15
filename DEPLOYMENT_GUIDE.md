# MEIOSIS Deployment Guide

## Overview

This project has been updated to work across different deployment scenarios:
- Local development on a single machine
- Multiple devices on the same network
- Cloud deployment (Vercel, etc.)

The key changes:
1. **Backend CORS** - Now environment-aware and configurable
2. **Frontend API URL** - Uses environment variables with intelligent fallbacks
3. **Service Worker** - Caching works with any API base URL

---

## Local Development (Same Machine)

### Setup
No special configuration needed for local development.

**Backend:**
```bash
cd backend
npm run dev  # Starts on http://localhost:5000
```

**Frontend:**
```bash
cd doctor-frontend
npm run dev  # Starts on http://localhost:5173
```

### Configuration
- Leave `backend/.env` CORS_ORIGINS empty
- Leave `doctor-frontend/.env` VITE_API_BASE_URL empty
- Frontend automatically detects `http://localhost:5000`

---

## Other Devices on Local Network

Use this setup if backend runs on Machine A and you're developing on Machine B.

### Step 1: Find Backend Machine IP

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

**Linux/Mac:**
```bash
ifconfig
# Look for inet address, typically 192.168.x.x or 10.0.x.x
```

### Step 2: Configure Backend

**File: `backend/.env`**
```
PORT=5000
CORS_ORIGINS=http://[YOUR_FRONTEND_IP]:5173
```

Example:
```
CORS_ORIGINS=http://192.168.1.101:5173
```

### Step 3: Configure Frontend

**File: `doctor-frontend/.env`**
```
VITE_API_BASE_URL=http://[BACKEND_IP]:5000
```

Example:
```
VITE_API_BASE_URL=http://192.168.1.100:5000
```

### Step 4: Run

**On Backend Machine:**
```bash
cd backend
npm run dev
```

**On Frontend Machine:**
```bash
cd doctor-frontend
npm run dev
```

### Troubleshooting Network Issues
- Ensure both machines are on the same WiFi/network
- Check Windows Firewall allows port 5000 (Backend) and 5173 (Frontend dev server)
- Test connectivity: `ping [BACKEND_IP]` from frontend machine
- Check CORS error in browser console - make sure CORS_ORIGINS matches exactly

---

## Vercel Deployment

### Scenario 1: Frontend and Backend in Separate Vercel Projects

#### Backend Deployment
1. Push backend code to GitHub
2. Go to https://vercel.com
3. Create new project → Select your backend GitHub repo
4. Set Environment Variables:
   - `DATABASE_URL` → Your database connection string
   - `GEMINI_API_KEY` → Your API key
   - `SARVAM_API_KEY` → Your API key
   - `CORS_ORIGINS` → Your frontend Vercel URL
     Example: `https://meiosis-doctor.vercel.app`
   - `PORT` → Leave empty (Vercel uses 3000 by default)

5. Deploy and note the backend URL
   Example: `https://meiosis-backend-xyz.vercel.app`

#### Frontend Deployment
1. Push frontend code to GitHub
2. Go to https://vercel.com
3. Create new project → Select your doctor-frontend GitHub repo
4. Before deploying, set Environment Variables:
   - `VITE_API_BASE_URL` → Your backend Vercel URL
     Example: `https://meiosis-backend-xyz.vercel.app`

5. Deploy

#### Verify
- App loads at `https://meiosis-doctor.vercel.app`
- API calls go to `https://meiosis-backend-xyz.vercel.app/api/`

### Scenario 2: Frontend and Backend on Same Vercel Domain

If you want both on the same domain (e.g., using a monorepo):

**Backend .env in Vercel:**
```
CORS_ORIGINS=https://meiosis.vercel.app
```

**Frontend .env in Vercel:**
```
VITE_API_BASE_URL=
```
(Leave empty - uses relative /api paths)

---

## Root-Level Pages (auth.js, app.js)

These use a different configuration system. For non-doctor-frontend deployments:

### Local Development
```html
<!-- In index.html or relevant page -->
<script>
  window.MEIOSIS_RUNTIME_CONFIG = {
    backendOrigin: 'http://localhost:5000',
    doctorFrontendUrl: 'http://localhost:5173'
  };
</script>
```

### Other Network/Production
Edit the HTML file where it's included:

```html
<script>
  window.MEIOSIS_RUNTIME_CONFIG = {
    backendOrigin: 'https://your-backend-url.vercel.app',
    doctorFrontendUrl: 'https://your-frontend-url.vercel.app'
  };
</script>
```

---

## Environment Variables Summary

### Backend (.env)
```
PORT=5000
DATABASE_URL=your_database_url
GEMINI_API_KEY=your_key
SARVAM_API_KEY=your_key
CORS_ORIGINS=frontend_url  # Or empty for localhost auto-detect
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://backend-url:5000  # Or empty for localhost
```

---

## Troubleshooting

### "CORS error" or "Cross-Origin Request Blocked"
- Check Backend CORS_ORIGINS matches your frontend domain exactly
- Include protocol and port: `https://app.example.com:5173`
- Wait ~30 seconds for Vercel env variables to propagate

### "Cannot connect to backend" on other device
- Ensure VITE_API_BASE_URL is set correctly
- Test: Open `http://[BACKEND_IP]:5000/health` in browser
- Check network connectivity: `ping [BACKEND_IP]`
- Check firewall allows port 5000

### Service worker not caching API calls
- Updated code caches any `/api/` requests
- Check DevTools → Application → Cache Storage
- Clear old caches if switching from localhost:5000 pattern

### "Port already in use"
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Mac/Linux

# Kill process
taskkill /PID [PID] /F  # Windows
kill [PID]  # Mac/Linux
```

---

## Testing Checklist

- [ ] Backend health check: `curl http://localhost:5000/health`
- [ ] Frontend API working: Check Network tab in DevTools
- [ ] Service worker caching: DevTools → Application → Cache Storage
- [ ] Offline functionality: DevTools → Network → Offline mode
- [ ] Cross-device: Backend IP reachable from other machine
- [ ] CORS headers present in API responses

---

## Architecture

```
Frontend (doctor-frontend)                    Backend (backend)
http://localhost:5173                         http://localhost:5000
  ↓                                              ↓
Uses VITE_API_BASE_URL                      Uses CORS_ORIGINS
  ↓                                              ↓
api.ts determines URL                        app.js validates origin
  ↓                                              ↓
Sends requests to API_BASE_URL               Allows/blocks request
  ↓                                              ↓
Service worker caches all /api/ calls        Returns data
```

---

## Key Files Modified

- `backend/src/app.js` - CORS configuration
- `doctor-frontend/src/lib/api.ts` - API URL detection
- `doctor-frontend/vite.config.ts` - Service worker caching patterns
- `.env.example` files - Configuration documentation

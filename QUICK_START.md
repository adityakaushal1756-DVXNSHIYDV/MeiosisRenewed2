# MEIOSIS - Quick Start Guide for New Device

## Prerequisites
- **Node.js** 16+ installed (https://nodejs.org/)
- **Git** (optional, only if cloning)

---

## Setup (5 minutes)

### 1. Open in VS Code

```bash
# Open the project folder in VS Code
code "/path/to/Meiosis Trial 8"
```

### 2. Install Dependencies

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd doctor-frontend
npm install
```

### 3. Start the Servers

**In Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Output: "MEIOSIS backend listening on http://localhost:5000"
```

**In Terminal 2 (Frontend):**
```bash
cd doctor-frontend
npm run dev
# Output includes: "VITE v... ready in ... ms"
# ➜  Local:   http://localhost:5173/
```

### 4. Open Browser

Visit: **http://localhost:5173**

✅ **Done!** The app should now be running locally.

---

## What if it doesn't work?

### Port already in use?

If you see "Port 5000 already in use" or similar:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

**Mac/Linux:**
```bash
lsof -i :5000
kill [PID]
```

Then restart the backend.

### "Cannot find module" error?

```bash
# Make sure node_modules are installed in both folders
cd backend && npm install
cd ../doctor-frontend && npm install
```

### Database error?

For local development testing, you can ignore initial database errors. The app won't have data, but the UI will load.

To use a real database:
1. Update `backend/.env.local` with your `DATABASE_URL`
2. Run: `cd backend && npm run prisma:push`

---

## Key Files

- **Backend** → `backend/src/server.js` (runs on port 5000)
- **Frontend** → `doctor-frontend/src/main.tsx` (runs on port 5173)
- **Environment** → `.env.local` files (no need to touch for local dev)

---

## Using on Different Device Same Network?

1. Note your backend machine IP:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   # Example: 192.168.1.100
   ```

2. On frontend machine, update `doctor-frontend/.env.local`:
   ```
   VITE_API_BASE_URL=http://192.168.1.100:5000
   ```

3. Restart frontend server:
   ```bash
   cd doctor-frontend
   npm run dev
   ```

---

## Stopping Servers

Press **Ctrl+C** in each terminal.

---

## Next Steps

- Check `DEPLOYMENT_GUIDE.md` for production/Vercel deployment
- Check `backend/.env.example` for API keys setup
- See each folder's README for detailed documentation

**Happy coding! 🚀**

# MEIOSIS - Setup Checklist for Other Devices

When exporting this project to another device or colleague, use this checklist to ensure everything works correctly.

## ✅ Before Exporting

- [ ] Clean up generated files:
  ```bash
  git clean -fd  # Remove untracked files
  ```
- [ ] Remove sensitive data:
  ```bash
  rm backend/.env
  rm backend/.env.local (after backing up *)
  rm doctor-frontend/.env
  rm doctor-frontend/.env.local (after backing up *)
  ```
  *Only needed if these contain real credentials*

- [ ] Ensure node_modules are NOT included:
  - Both `backend/node_modules` and `doctor-frontend/node_modules` should be in `.gitignore`
  - They will be reinstalled automatically

## ✅ On New Device - Initial Setup (5 minutes)

### Step 1: Extract Project
```bash
# Unzip or clone the project
cd /path/to/Meiosis\ Trial\ 8
```

### Step 2: Install Dependencies
```bash
# Terminal 1
cd backend
npm install

# Terminal 2 (new terminal)
cd doctor-frontend
npm install
```
⏱️ **Takes 2-3 minutes** depending on internet speed

### Step 3: Start Backend
```bash
# In backend terminal
npm run dev
# Should output: "MEIOSIS backend listening on http://localhost:5000"
```

### Step 4: Start Frontend
```bash
# In doctor-frontend terminal
npm run dev
# Should output: "Local:   http://localhost:5173/"
```

### Step 5: Open App
- Go to: **http://localhost:5173**
- App should load ✅

## ⚙️ Configuration (Only if needed)

### Local Network - Backend on Another Machine
1. Find machine IP:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
   Note the IPv4 address (e.g., 192.168.1.100)

2. Update `doctor-frontend/.env.local`:
   ```
   VITE_API_BASE_URL=http://192.168.1.100:5000
   ```

3. Restart frontend dev server

### Database Setup
If you need database access:
1. Update `backend/.env.local`:
   ```
   DATABASE_URL=your_postgres_connection_string
   ```
2. Run migrations (if needed):
   ```bash
   cd backend
   npm run prisma:push
   ```

### API Keys
To enable certain features update `backend/.env.local`:
```
GEMINI_API_KEY=your_key
SARVAM_API_KEY=your_key
```

Leave empty to skip these features during development.

## 🔍 Verification

After setup, check these:

- [ ] Backend running: `curl http://localhost:5000/health` (should return JSON)
- [ ] Frontend accessible: Open http://localhost:5173 in browser
- [ ] API connection: Check Network tab in DevTools for API calls
- [ ] No CORS errors in browser console
- [ ] Service worker installed: Check DevTools → Application → Service Workers

## 🐛 Common Issues

### "Port 5000 already in use"
```bash
netstat -ano | findstr :5000  # Windows - find the PID
taskkill /PID 1234 /F         # Windows - kill it

lsof -i :5000                  # Mac/Linux
kill -9 [PID]
```

### "Cannot find module" 
```bash
# Reinstall dependencies
cd backend && npm ci && cd ../doctor-frontend && npm ci
```

### "Cannot connect to backend" from other device
- Ensure machines are on same network (ping should work)
- Check `VITE_API_BASE_URL` is correctly set
- Check Windows/Mac firewall allows port 5000
- Verify backend IP address

### "npm: command not found"
Node.js not installed. Download from https://nodejs.org (LTS version)

### Frontend won't load
- Check port 5173 is free: `lsof -i :5173`
- Try: `npm install` in `doctor-frontend` folder again
- Clear browser cache (Ctrl+Shift+Delete)

## 📖 Next Steps

1. **Local Development** - See [QUICK_START.md](QUICK_START.md)
2. **Multi-Device Setup** - See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. **Production Deployment** - See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 📚 File Reference

| File | Purpose |
|------|---------|
| `README.md` | Project overview & architecture |
| `QUICK_START.md` | Quick setup for local development |
| `DEPLOYMENT_GUIDE.md` | Multi-device & production deployment |
| `SETUP_CHECKLIST.md` | This file |
| `backend/.env.example` | Backend configuration reference |
| `doctor-frontend/.env.example` | Frontend configuration reference |
| `.vscode/settings.json` | VS Code editor settings |
| `.vscode/extensions.json` | Recommended extensions |

## ✨ ProTips

- Use separate terminals for backend and frontend (don't nest them)
- Keep both dev servers running in background
- Use VS Code terminal feature (split terminals)
- Install recommended extensions for better DX
- Hot reload works for both frontend and backend changes
- Check [QUICK_START.md](QUICK_START.md) for more tips

---

**Estimated time to fully working setup: 5-10 minutes** ⏱️

Questions? Check the documentation files or troubleshooting section above.

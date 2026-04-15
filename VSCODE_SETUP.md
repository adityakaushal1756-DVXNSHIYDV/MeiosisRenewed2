# MEIOSIS - VS Code Setup & Troubleshooting

This guide helps ensure the project works perfectly in VS Code on any device.

## 🎯 VS Code Setup (2 minutes)

### 1. Open Project in VS Code

```bash
# From command line
code "/path/to/Meiosis Trial 8"

# Or: File → Open Folder → Select project folder
```

### 2. Install Recommended Extensions

VS Code should show a popup: **"Install recommended extensions"**

Click it, or manually:
- Open: `Ctrl+Shift+X` (Extensions)
- Search: type in filter bar at top
- Install recommended extensions:
  - **Prettier** (esbenp.prettier-vscode)
  - **ESLint** (dbaeumer.vscode-eslint)
  - **Tailwind CSS** (bradlc.vscode-tailwindcss)
  - **TypeScript** (ms-vscode.vscode-typescript-next)

### 3. Open Integrated Terminal

`Ctrl+J` or `View → Terminal`

### 4. Setup Terminals

Split terminal to run backend and frontend:
- `Ctrl+Shift+5` to split the terminal
- Or use the split button at right of terminal tab

## 🚀 Running in VS Code

### Option 1: Integrated Terminal (Easiest)

```bash
# Terminal 1 (left)
cd backend
npm install
npm run dev

# Terminal 2 (right)  
cd doctor-frontend
npm install
npm run dev
```

Both servers run in VS Code with full output visible.

### Option 2: VS Code Debugger (Advanced)

See `.vscode/launch.json` for debug configurations.

Click **Run and Debug** → Select **Backend Debug** → Press F5

## ⚙️ VS Code Settings

Your project comes with optimized settings in `.vscode/settings.json`:

- Auto-format on save (Prettier)
- ESLint auto-fix on save
- Tailwind CSS intellisense
- TypeScript workspace configuration
- Exclude node_modules from search/explorer

All configured automatically - no extra setup needed!

## 🎨 Editor Features

### IntelliSense (Auto-completion)

Type and press `Ctrl+Space`:
```typescript
// Frontend - component imports auto-complete
import { Button } from '@/components/...'

// Backend - route definitions auto-complete
app.use('/api/...'
```

### Go to Definition

`Ctrl+Click` any identifier to jump to its definition.

Useful for:
- API route handlers
- Component imports
- Type definitions

### Find All References

`Ctrl+Shift+H` or right-click → Find All References

See everywhere a function/component is used.

### Rename Symbol

`F2` or right-click → Rename Symbol

Safely rename across entire project.

## 🔍 Debugging

### View Backend Logs

Terminal shows all backend output:
- API requests
- Database queries (with Prisma)
- Errors and warnings

Logs update in real-time.

### View Frontend Logs

Browser DevTools shows frontend logs:
- `F12` or `Ctrl+Shift+I`
- Console tab
- Shows API calls, errors, warnings

### Network Tab (API Debugging)

Browser DevTools → Network tab:
- See all API requests to backend
- Check response status and content
- Debug CORS errors here!

## 🔗 Multi-Device Setup in VS Code

If backend runs on another machine:

1. Open `.vscode/settings.json` at top-level (if needed for documentation)
2. Update `doctor-frontend/.env.local`:
   ```
   VITE_API_BASE_URL=http://[BACKEND_IP]:5000
   ```
3. Restart frontend in terminal
4. Frontend automatically connects to remote backend

No other VS Code changes needed!

## 📝 File Navigation

### Quick File Open

`Ctrl+P` and type filename:
```
// Frontend files
api.ts          # API configuration
App.tsx         # Main app
vite.config.ts  # Build config

// Backend files  
server.js       # Entry point
app.js          # Express app
```

### Go to Line

`Ctrl+G` and type line number:
```
api.ts:25       # Go to line 25 of api.ts
```

### Search Across Project

`Ctrl+Shift+F` to search all files:
```
CORS           # Find CORS configuration
localhost:5000 # Find hardcoded URLs (shouldn't exist!)
```

## 🧪 Testing Extensions

### Thunder Client (API Testing)

Optional extension for testing API endpoints:
1. Install: `rangav.vscode-thunder-client`
2. Open: View → Thunder Client
3. Create request: `GET http://localhost:5000/health`

Great for testing backend routes!

### REST Client

Alternative to Thunder Client:
1. Install: `humao.rest-client`
2. Create file: `test.http`
3. Write requests:
   ```http
   GET http://localhost:5000/health
   ```

## 🐛 Common VS Code Issues

### "TypeScript not found in doctor-frontend"

Solution:
```bash
cd doctor-frontend
npm install  # Reinstall dependencies

# Or select TypeScript version:
# Ctrl+Shift+P → "TypeScript: Select TypeScript Version"
# → "Use Workspace Version"
```

### Terminal can't find `npm` command

Solution:
- Restart VS Code completely
- Or check if Node.js is installed: `node --version`
- Add to PATH if needed (Windows users)

### Hot reload not working

- Check server is running in terminal (no red X)
- Browser: `Ctrl+Shift+R` (hard refresh)
- Restart both servers
- Check no syntax errors in modified file

### Prettier not formatting

- Save file with `Ctrl+S`
- Or: `Shift+Alt+F` to format manually
- Check `.vscode/settings.json` has prettier configured
- Restart VS Code if it stops working

### ESLint shows errors that don't matter

These are linting warnings, not errors. The app still runs!

To fix:
- Read the error message
- Follow suggestion in inline lightbulb (💡)
- Or use `Ctrl+Shift+P` → "ESLint: Fix all auto-fixable"

### Can't connect to backend from frontend

Check:
1. Backend terminal shows: "listening on http://localhost:5000"
2. Browser DevTools → Network → API request status
3. Check CORS error in Console tab
4. Check `VITE_API_BASE_URL` in `.env.local`
5. Restart frontend if you changed `.env.local`

### Port already in use error

Find and kill the process:
```bash
# In VS Code terminal
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Kill it
taskkill /PID [PID] /F         # Windows
kill [PID]                      # Mac/Linux
```

## 💡 Pro Tips

### Multi-Root Workspace
Open both folders in `one` VS Code window:
- File → Add Folder to Workspace
- Select `backend` folder
- Select `doctor-frontend` folder

Gives you one integrated workspace!

### Task Running
Auto-run startup scripts:
- `Ctrl+Shift+B` to run build task
- Configure in `.vscode/tasks.json` (optional)

### Git Integration
Built-in Git support in VS Code:
- Ctrl+Shift+G - Source Control
- Commit and push without leaving VS Code

### Remote Development
If on different machine, use SSH extension:
- Install: `ms-vscode-remote.remote-ssh`
- Connect to remote machine
- Work as if local!

## 🎓 Learning Resources

### VS Code Shortcuts
- `F1` or `Ctrl+Shift+P` - Command palette (search anything)
- `Ctrl+K Ctrl+/` - Toggle comment
- `Alt+Up/Down` - Move line up/down
- `Ctrl+` ` - Toggle terminal

### Project Shortcuts
- Backend: `/backend/src/server.js` - Start here
- Frontend: `/doctor-frontend/src/main.tsx` - React entry
- API config: `/doctor-frontend/src/lib/api.ts` - URL setup

## ✅ Verification Checklist

After setup, verify in VS Code:

- [ ] No red squiggles under imports (TypeScript working)
- [ ] No red errors in Problems panel
- [ ] Backend terminal shows "listening on 5000"
- [ ] Frontend terminal shows "Local:" URL
- [ ] Browser http://localhost:5173 loads
- [ ] Network tab shows API calls (without CORS errors)
- [ ] F12 Console has no errors

---

## 📚 Quick Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl+J` | Toggle terminal |
| `Ctrl+Shift+X` | Extensions |
| `Ctrl+P` | Quick file open |
| `Ctrl+Shift+F` | Search all files |
| `Ctrl+G` | Go to line |
| `F2` | Rename symbol |
| `Ctrl+K Ctrl+0` | Fold all |
| `F5` | Start debugging |
| `Ctrl+Shift+B` | Run build task |

---

**All ready?** Open `http://localhost:5173` and start developing! 🚀

For issues not listed here, check:
- [QUICK_START.md](QUICK_START.md) - General setup
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Multi-device setup
- Browser DevTools (F12) - Frontend issues
- Backend terminal - Server errors

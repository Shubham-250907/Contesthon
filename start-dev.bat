@echo off
echo Starting Contesthon Backend and Frontend...
start "Contesthon Backend (Port 3001)" cmd /k "cd contesthon-backend && pnpm dev"
start "Contesthon Frontend (Port 5173)" cmd /k "cd contesthon-frontend && pnpm dev"
echo Both servers are launching.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
pause

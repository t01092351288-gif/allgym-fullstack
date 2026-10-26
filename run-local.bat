@echo off
cd /d %~dp0
if not exist allgym-backend\.env copy allgym-backend\.env.example allgym-backend\.env
if not exist allgym-frontend\.env.local copy allgym-frontend\.env.example allgym-frontend\.env.local
call npm install
call npm run setup
call npm run dev

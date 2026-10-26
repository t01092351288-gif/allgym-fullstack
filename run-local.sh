#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -f "allgym-backend/.env" ]; then
  cp allgym-backend/.env.example allgym-backend/.env
fi

if [ ! -f "allgym-frontend/.env.local" ]; then
  cp allgym-frontend/.env.example allgym-frontend/.env.local
fi

npm install
npm run setup
npm run dev

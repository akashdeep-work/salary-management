# ACME Salary Management System

## Stack
- Backend: Node.js, Express, TypeScript, better-sqlite3, Zod, Vitest
- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, React Router

## Setup

### Backend
cd backend
npm install
npm run seed     # seeds 10,000 employees into data/salary.db
npm run dev      # http://localhost:4000
npm test         # unit tests (in-memory db)

### Frontend
cd frontend
npm install
npm run dev      # http://localhost:5173

Set `VITE_API_URL` in `frontend/.env` if backend isn't on localhost:4000/api.

## API
- GET /api/employees — list/search/filter/paginate
- GET /api/employees/:id
- POST /api/employees
- PUT /api/employees/:id
- GET /api/employees/:id/salary-history
- POST /api/employees/:id/salary
- GET /api/analytics/summary|by-department|by-country|by-gender|salary-bands

See REQUIREMENTS.md for scope and ARCHITECTURE.md for design trade-offs.
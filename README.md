# Smart Health Appointment Booking System (MERN)

MongoDB + Express + React + Node.js. Doctors, patients and admins with JWT auth, fixed 30-minute slots,
double-booking prevention at the database level, 2-bookings-per-doctor-per-week limit, 6-hour cancellation
rule, audit log, and 24-hour reminders via `node-cron`.

```
smart-health-booking/
├── server/   Express API (port 5000)
└── client/   React + Vite app (port 5173)
```

## 1. Prerequisites
- **Node.js 18 or newer** (check with `node -v`)
- **MongoDB** - pick ONE:
  - **MongoDB Atlas free tier (M0)** - recommended, nothing to install
    1. Create a free cluster at https://www.mongodb.com/cloud/atlas
    2. Database Access -> add a user (username + password)
    3. Network Access -> Add IP Address -> "Allow access from anywhere" (for development)
    4. Connect -> Drivers -> copy the connection string, e.g.
       `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smart_health`
  - **Local MongoDB 6.0+** - connection string `mongodb://127.0.0.1:27017/smart_health`

## 2. Run the backend
```bash
cd server
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
```
Open `server/.env` and set:
- `MONGO_URI` - your connection string from step 1
- `JWT_SECRET` - any long random string
- `ADMIN_SIGNUP_CODE` - the code needed to register an admin account

Then:
```bash
npm run seed    # optional: creates demo admin, 5 doctors and a patient
npm run dev     # starts the API on http://localhost:5000
```
You should see `MongoDB connected, indexes ready` and `API running on http://localhost:5000`.

## 3. Run the frontend (new terminal)
```bash
cd client
npm install
npm run dev     # opens on http://localhost:5173
```
Open http://localhost:5173. Vite proxies `/api` to the backend, so no extra config is needed.

## 4. Demo logins (after `npm run seed`)
| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@demo.com     | Admin@1234 |
| Doctor  | doctor1@demo.com (up to doctor5) | Demo@1234 |
| Patient | patient@demo.com   | Demo@1234  |

You can also register your own accounts. For admin registration, enter the `ADMIN_SIGNUP_CODE` from `.env`.

## 5. How to test each rule
1. **Fixed slots / double booking** - log in as a patient, open a doctor, book Monday 10:00. Register a
   second patient in another browser (or incognito) and the same slot is no longer visible; a direct API
   call returns `409`.
2. **Weekly limit** - as one patient, book 2 slots with the same doctor in the same week; the 3rd is rejected.
   A different doctor, or the next week, is still allowed.
3. **Cancellation (6h)** - cancel from "My appointments". Slots less than 6 hours away show "Locked".
   A cancelled slot becomes available again, and each cancellation appears in Admin -> Cancellation log.
4. **Role-based visibility** - patients see only available slots; the doctor's "My schedule" shows booked
   (red, with patient name) and available (green); the Admin tabs list doctors, patients and all bookings.
5. **Session persistence** - refresh the page: you stay logged in. Click **Logout**: you return to Login.
6. **Reminders** - every 5 minutes the server checks for booked appointments starting within 24 hours and
   prints `[MOCK REMINDER] ...` in the server console (one per appointment). To get real emails, fill the
   `SMTP_*` values in `.env`.

## 6. API overview
| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | any |
| GET | `/api/doctors`, `/api/doctors/:id`, `/api/doctors/:id/slots?from=YYYY-MM-DD&to=YYYY-MM-DD` | any |
| POST | `/api/appointments` `{ doctorId, datetime, reason }` | patient |
| GET | `/api/appointments/me` | patient, doctor |
| PATCH | `/api/appointments/:id/cancel` `{ reason }` | patient, doctor, admin |
| GET | `/api/admin/doctors`, `/patients`, `/appointments`, `/audit-logs` | admin |

## 7. Good to know
- **Timezone:** doctor working hours are interpreted in `SLOT_TZ_OFFSET_MINUTES` (default `330` = IST).
  Change it in `.env` if your clinic is elsewhere (must be a multiple of 30). Times are stored in UTC.
- **Transactions:** cancellation + audit log run in a MongoDB transaction on Atlas / replica sets. On a plain
  local standalone MongoDB the code automatically falls back to two sequential writes.
- **Working hours:** new doctors default to Mon-Fri, 09:00-17:00. Change `workingDays` / `workingHours`
  on the `DoctorProfile` document to customise.
- **Production build:** `cd client && npm run build`, then serve `client/dist` from any static host and set
  `VITE_API_URL` to your API URL (and `CLIENT_ORIGIN` on the server to the site URL).

## 8. Troubleshooting
- `Missing required environment variable` -> you did not create/fill `server/.env`.
- `MongooseServerSelectionError` -> wrong `MONGO_URI`, wrong password, or your IP is not allowed in Atlas Network Access.
- Login page shows network errors -> the backend is not running on port 5000.
- Port already in use -> change `PORT` in `.env` and update the proxy target in `client/vite.config.js`.

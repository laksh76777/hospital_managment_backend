# Sanjeevani Hospital Management — Backend REST API

Backend API services for **Sanjeevani Super-Speciality Hospital & Research Institute**, providing authentication, physician roster management, atomic slot reservation, and administrative confirmation workflows.

frontend repo : https://github.com/laksh76777/hospital_managment_frontend.git 

backend repo : https://github.com/laksh76777/hospital_managment_backend.git

---

## 🛠️ Tech Stack & Dependencies

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 4
- **Database & ODM:** MongoDB Atlas Cloud + Mongoose 8
- **Validation:** Zod (Strict field-level request schemas)
- **Security:** JSON Web Tokens (JWT), Bcrypt.js, CORS
- **Cloud Auth Integration:** Firebase Admin SDK
- **Date Handling:** date-fns (Indian Standard Time calculations)
- **Logging:** Morgan

---

## 📁 Source Code Structure

```
backend/
├── config/
│   ├── db.js                     # MongoDB connection with automatic reconnection logic
│   └── firebase.js               # Firebase Admin SDK initialization & fallback handler
│
├── controllers/
│   ├── authController.js         # User registration, login, profile, and mobile sync
│   ├── doctorController.js       # Doctor faculty retrieval, creation, updates & schedules
│   └── appointmentController.js  # Atomic booking, conflict check, slot query & status updates
│
├── middleware/
│   ├── verifyToken.js            # Dual Firebase ID Token / JWT verification middleware
│   ├── checkRole.js              # Role-Based Access Control ('patient', 'doctor', 'admin')
│   ├── validate.js               # Zod validation schema runner
│   └── errorHandler.js           # Centralized exception & duplicate key error handler
│
├── models/
│   ├── User.js                   # Patient, Doctor & Admin user accounts
│   ├── Doctor.js                 # Doctor profile, specialization & weekly timetable
│   └── Appointment.js            # Consultation records with unique compound index
│
├── routes/
│   ├── authRoutes.js             # /api/auth endpoints
│   ├── doctorRoutes.js           # /api/doctors endpoints
│   ├── appointmentRoutes.js      # /api/appointments endpoints
│   └── adminRoutes.js            # /api/admin endpoints
│
├── scripts/
│   └── seedData.js               # Hospital seed data (6 specialist doctors & default users)
│
├── .env                          # MongoDB URI, JWT Secret, and Port
├── package.json                  # Dependencies & execution scripts
└── server.js                     # Express app entry point
```

---

## 🗄️ Database Models

### 1. `User` Schema
Stores patient, doctor, and administrator credentials and contact details:
- `name` (String, required)
- `email` (String, required, unique, lowercase)
- `password` (String, hashed with bcrypt)
- `phone` (String, optional/recommended: 10-digit mobile number)
- `role` (String, enum: `['patient', 'doctor', 'admin']`, default: `'patient'`)
- `firebaseUID` (String, optional for Firebase-linked accounts)

### 2. `Doctor` Schema
Stores specialist faculty profiles and weekly availability timetables:
- `name` (String, required)
- `email` (String, required, unique)
- `specialization` (String, required, e.g. `'Cardiology'`)
- `department` (String, required, e.g. `'Cardiology & Heart Care'`)
- `experience` (Number, years in practice)
- `fees` (Number, consultation fee in INR ₹)
- `phone` (String, direct clinic contact)
- `availability` (Array of daily slots: `[{ day: 'Mon', slots: [{ time: '09:00 AM' }] }]`)

### 3. `Appointment` Schema
Stores outpatient consultation bookings with concurrency protection:
- `patientRef` (ObjectId referencing `User`, required)
- `doctorRef` (ObjectId referencing `Doctor`, required)
- `appointmentDate` (Date, normalized to `startOfDay` in IST)
- `time` (String, required, e.g. `'10:00 AM'`)
- `status` (String, enum: `['pending', 'confirmed', 'completed', 'cancelled']`, default: `'pending'`)
- `notes` (String, clinical symptoms/visit reasons)
- `patientName`, `patientEmail`, `patientPhone` (Denormalized for instant OPD pass rendering)
- **Unique Compound Index:**
  ```javascript
  AppointmentSchema.index(
    { doctorRef: 1, appointmentDate: 1, time: 1 },
    { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
  );
  ```

---

## 📡 REST API Catalog

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new patient account with name, email, password, and mobile number |
| `POST` | `/api/auth/login` | Public | Login with email and password, returns JWT token and user profile |
| `GET` | `/api/auth/me` | Protected | Fetch current logged-in user profile |

### 2. Doctor Faculty Endpoints (`/api/doctors`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors` | Public | List all active hospital doctors (supports `?specialization=` filter) |
| `GET` | `/api/doctors/:id` | Public | Fetch single doctor profile with full weekly availability timetable |

### 3. Appointment Endpoints (`/api/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments/booked-slots` | Public | Query already-booked slots for a doctor on a specific date (`?doctorId=&date=`) |
| `POST` | `/api/appointments` | Patient / Admin | Book consultation slot. Checks conflict; sets initial status to `'pending'` |
| `GET` | `/api/appointments/my` | Patient | Get all consultation visits booked by the logged-in patient |
| `PATCH` | `/api/appointments/:id/cancel` | Patient / Admin | Cancel a pending or confirmed appointment |
| `PATCH` | `/api/appointments/:id/status` | Doctor / Admin | Update consultation status (`'confirmed'`, `'completed'`, `'cancelled'`) |

### 4. Admin Management Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Aggregate counts for patients, doctors, today's visits, and pending approvals |
| `GET` | `/api/admin/appointments` | Admin | Full hospital consultation registry (supports `?status=`, `?date=`, `?from=`, `?to=`) |
| `GET` | `/api/admin/doctors` | Admin | Full faculty roster with contact numbers and schedules |
| `POST` | `/api/admin/doctors` | Admin | Onboard a new physician and configure credentials and weekly slots |
| `PUT` | `/api/admin/doctors/:id` | Admin | Update doctor profile details, fees, or department |
| `DELETE` | `/api/admin/doctors/:id` | Admin | Remove doctor from hospital active roster |

---

## 🛡️ Concurrency & Business Rules

1. **Strict Conflict Check:**
   Before creating an appointment, the server queries:
   ```javascript
   const existingBooking = await Appointment.findOne({
     doctorRef: doctorId,
     appointmentDate: targetDateStart,
     time: time.trim(),
     status: { $ne: 'cancelled' },
   });
   ```
   If found, the server responds immediately with `409 Conflict`:
   ```json
   {
     "success": false,
     "message": "The 10:00 AM slot on Saturday, Sep 12 is already booked. Please select another time slot."
   }
   ```

2. **Admin-Only Confirmation:**
   Appointments are created with status `'pending'`. Only an administrator or the assigned doctor can advance the status to `'confirmed'` or `'completed'`.

3. **Status Transitions:**
   - `pending` &rarr; `confirmed` (Approved by Admin/Doctor)
   - `confirmed` &rarr; `completed` (Consultation completed)
   - `pending` or `confirmed` &rarr; `cancelled` (Appointment revoked)
   - Transitions from `completed` or `cancelled` to any other state are rejected with `400 Bad Request`.

---

## 🚀 Running the Server

```bash
# Install dependencies
npm install

# Start Express server with auto-reload (development)
npm run dev

# Start Express server (standard)
node server.js
```

The server starts on `http://localhost:5000`.

---



# 🏥 HealSync AI - Project Blueprint & Workflow

Welcome to **HealSync AI**! This document serves as the architectural blueprint and setup roadmap for our AI-powered SaaS booking and ambient scribing platform.

---

## 🎨 Project Overview & SaaS Vision

HealSync AI solves two massive healthcare pain points:
1. **Patients** get structured AI triage, accurate specialist matching, and real-time waiting list estimates.
2. **Doctors** save hours of paperwork daily via an **Ambient voice scribe** that listens to consultations and drafts formatted clinical notes (SOAP notes) and prescriptions automatically.

---

## 📂 Project Directory Structure

```
healsync-ai/
├── prisma/
│   ├── schema.prisma         # Relational database models (PostgreSQL)
│   └── seed.ts               # Default roles, mock doctor specialties, and accounts
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, registration, role selectors
│   │   ├── (patient)/        # Symptom triage chat, bookings, wait-queue list
│   │   ├── (doctor)/         # Calendar, patient check-in queues, consultation scribe
│   │   ├── api/
│   │   │   ├── triage/       # AI symptom analysis route
│   │   │   ├── scribe/       # Whisper transcription & SOAP report generator
│   │   │   └── queue/        # WebSocket/SSE route for live waiting ETA push
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # Button, Select, Dialog, Card elements
│   │   └── ThemeToggle.tsx   # Premium theme switcher
│   ├── actions/              # Server actions for appointments and medical records
│   └── lib/
│       ├── prisma.ts         # Singleton PostgreSQL adapter connection client
│       └── validations.ts    # Zod schemas for forms and bookings
└── PROJECT_GUIDE.md          # This blueprint file
```

---

## 🔄 Detailed System Flow & Technical Details

### 1. Patient Triage & Booking UI
- **Action**: The patient enters symptoms in a chat interface.
- **Workflow**:
  - Chat data is sent to `/api/triage` (using GPT-4o or Claude 3.5 Sonnet).
  - AI structures symptoms, screens for red flags, suggests the correct doctor specialty, and returns a JSON payload.
  - The UI suggests doctors matching that specialty and offers an interactive booking calendar.
  - Database stores a record in the `Appointment` table, attaching the AI's triage summary.

### 2. Doctor Dashboard & Voice Scribe
- **Action**: The doctor records the visit conversation, then clicks "Process".
- **Workflow**:
  - The browser streams raw audio to the backend (`/api/scribe`).
  - The backend transcribes audio using the **Whisper API** to get a text dialogue.
  - An LLM analyzes the transcript and structures it into a standard **SOAP note** (Subjective, Objective, Assessment, Plan) alongside a structured medication list.
  - The doctor reviews the AI-generated SOAP note, corrects details, and clicks "Approve" to save it to the `MedicalRecord` table.

### 3. Dynamic Waiting Room Queue (Live ETA)
- **Action**: Patients see their active position in the clinic queue on their app.
- **Workflow**:
  - Whenever a doctor completes a checkup, a socket event triggers.
  - The system recalculates wait times (`Queue Position * Avg Doctor Checkup Speed`) and broadcasts the updated ETA to waiting patients in real-time.

---

## 🚀 Setup Steps to Run in Your Next Chat

When you switch to this folder, run these commands in the terminal to initialize the database layer and styling templates:

1. **Install database dependencies**:
   ```bash
   npm install @prisma/client @prisma/adapter-pg pg
   npm install -D prisma @types/pg
   ```

2. **Install UI components (Lucide icons and helper utilities)**:
   ```bash
   npm install lucide-react clsx tailwind-merge
   ```

3. **Initialize Prisma Configuration**:
   ```bash
   npx prisma init
   ```

# Veda - Voice-First AI Merchant Copilot

A hands-free, voice-activated AI business manager for small merchants and Kirana stores in India.

## Key Features
- **Hands-Free Voice Interface**: "Always listening" wake word ("Veda"). No typing required.
- **Merchant Copilot**: Diagnoses profit changes, identifies products to stop selling, finds costly suppliers, and checks hiring affordability.
- **Inventory & Expiry Recovery**: Predicts expiring stock likely to go unsold, and suggests optimal discounts.
- **Udhaar Ledger**: Tracks given/received credit by voice and drafts WhatsApp reminders.
- **Schemes & Compliance Autopilot**: Matches merchant turnover to PM SVANidhi, MUDRA, Udyam, and GST thresholds.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure PostgreSQL**
   Copy `.env.example` to `.env` and set:
   ```env
   DATABASE_URL=your_pooled_postgresql_url
   DIRECT_URL=your_direct_postgresql_url
   ```
   For a Vercel/serverless deployment, use a pooled connection for `DATABASE_URL`. `DIRECT_URL` is used by Prisma for direct database administration/migrations.

3. **Configure LLM Providers**
   At least one provider is recommended. The app falls back between Gemini, Groq, and OpenRouter, then to the local rule engine.
   ```env
   GEMINI_API_KEY=...
   GEMINI_MODEL=gemini-2.5-flash
   GROQ_API_KEY=...
   GROQ_MODEL=llama-3.1-8b-instant
   OPENROUTER_API_KEY=...
   OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
   ```

4. **Initialize the Database**
   For a new hackathon database:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   The seed intentionally recreates the demo merchant and should only be run when you want to reset the demo data.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Demo Script
Open `http://localhost:3000`. Tap the screen once to allow microphone access, then say:

1. *"Veda, what are today's sales?"*
2. *"Veda, why did my profit fall this month?"*
3. *"Veda, Ramesh ne 200 ka udhaar liya."*
4. *"Veda, undo."* (Reverses the previous action)
5. *"Veda, which products should I stop selling?"*
6. *"Veda, what will expire soon?"*

## Architecture Notes
- **Analytics Engine**: Deterministic pure functions in `lib/analytics/`. The LLM **never** calculates numbers. It only translates intents to engine calls, and phrases the resulting JSON.
- **Voice Engine**: Uses the browser's Web Speech API (`SpeechRecognition` and `speechSynthesis`). 
- **Offline / Free-Tier Resilience**: If LLM API keys are missing, rate-limited, or internet is down, the `lib/intent-rules.ts` Regex engine handles 90% of common commands natively.

## Privacy & Security
- **No Raw Audio Stored**: Veda only stores text after the wake word is detected.
- **Browser Privacy**: Web Speech API may use Google/OS servers for transcription depending on the browser.
- **LLM Privacy**: Only minimal JSON (no customer phone numbers) is sent to the LLM.

**Disclaimer**: Government scheme rules seeded in the database are PLACEHOLDERS for demonstration purposes. Always verify scheme eligibility and compliance deadlines with official government sources.


## Vercel + PostgreSQL Deployment

This project is configured for Vercel. **Do not use the included `prisma/dev.db` in production.** Use a hosted PostgreSQL database such as Supabase or Neon.

### 1. Create PostgreSQL
Create a PostgreSQL database and obtain:
- `DATABASE_URL`: pooled/serverless connection string
- `DIRECT_URL`: direct connection string for Prisma migrations

Supabase users can copy the pooled connection for `DATABASE_URL` and the direct connection for `DIRECT_URL`.

### 2. Set Vercel environment variables
In **Vercel → Project → Settings → Environment Variables**, add:

```text
DATABASE_URL
DIRECT_URL
GEMINI_API_KEY
GEMINI_MODEL
GROQ_API_KEY
GROQ_MODEL
OPENROUTER_API_KEY
OPENROUTER_MODEL
```

At minimum, set `DATABASE_URL`, `DIRECT_URL`, and one LLM API key.

### 3. Deploy
Import the repository into Vercel. Framework should be detected as **Next.js**. The included `vercel.json` runs `prisma generate` before `next build`.

### 4. Create the production schema
This hackathon package intentionally does not ship the old SQLite migration history. For the first PostgreSQL deployment, run:

```bash
npx prisma db push
```

Then seed the demo data once:

```bash
npm run db:seed
```

For a future production release, commit PostgreSQL Prisma migrations and switch the deployment workflow to `prisma migrate deploy`.

### 5. Seed the hackathon demo data
The seed script intentionally clears and recreates the demo merchant. Run it **once**, manually, after the database is initialized:

```bash
npm run db:seed
```

Do **not** run the seed script from the Vercel build command because it deletes existing merchant data.

### 6. Local production check
Copy `.env.example` to `.env`, fill in the same PostgreSQL/LLM variables, then run:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run build
npm start
```

### Important
The current demo UI/API uses `merchantId = 1`. That is acceptable for the single-merchant hackathon demo, but production multi-merchant authentication should derive the merchant ID from the authenticated user instead of accepting it from the browser.

# Veda / Merchant Copilot — Vercel Deployment

## 1. Create a PostgreSQL database

Use Supabase, Neon, or another hosted PostgreSQL provider.

For Supabase:
1. Create a new project.
2. Open **Connect**.
3. Copy a pooled/session connection string for `DATABASE_URL`.
4. Copy the direct connection string for `DIRECT_URL`.
5. Replace the password placeholder in both strings with the database password.

Do not commit either value to GitHub.

## 2. Push this project to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Prepare Merchant Copilot for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If the repository already exists, only commit and push the changes.

## 3. Import into Vercel

1. Open Vercel.
2. Select **Add New → Project**.
3. Import the GitHub repository.
4. Keep **Framework Preset = Next.js**.
5. Keep the root directory as the repository root.
6. The included `vercel.json` uses `prisma generate && next build` as the build command.
7. Do not add a custom output directory.

## 4. Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for Production (and Preview if desired):

```text
DATABASE_URL=your-pooled-postgresql-url
DIRECT_URL=your-direct-postgresql-url

GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.1-8b-instant

OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

At minimum, `DATABASE_URL`, `DIRECT_URL`, and one LLM API key are required for the full demo.

**Never prefix these secrets with `NEXT_PUBLIC_`.** They are server-side credentials.

## 5. Initialize the production database

The first deployment uses Prisma `db push` because this hackathon package intentionally does not carry the previous SQLite migration history.

Run from your local project directory with the production database variables available:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

The seed creates the demo merchant **Ramesh Kirana Store** and intentionally clears/recreates demo data. Run it only when you want to reset the demo database.

Do not put `db:seed` into the Vercel build command.

## 6. Deploy

After adding environment variables, redeploy from Vercel. Vercel will install dependencies, run Prisma generation, and build Next.js.

## 7. Verify the deployment

Test these flows on the deployed URL:

1. Dashboard loads.
2. Inventory page loads.
3. Udhaar page loads.
4. Voice microphone permission works in Chrome.
5. Ask: `Veda, what are today's sales?`
6. Ask: `Veda, why did my profit fall this month?`
7. Say: `Veda, Ramesh ne 200 ka udhaar liya.`
8. Say: `Veda, undo.`
9. Check that the API health/LLM route reports the configured provider.

## 8. Important hackathon limitation

The current demo is single-merchant and uses `merchantId = 1` in several server/page paths. That is intentional for the seeded hackathon demo. Before using this as a real multi-merchant product, add authentication and derive the merchant ID from the authenticated user rather than accepting it from the browser.

## 9. Future production migration workflow

For a production product, create and commit PostgreSQL Prisma migrations and use:

```bash
npx prisma migrate deploy
```

instead of relying on `db push`.

# Beacon Verify

Standalone internal tool for planner onboarding. Three tools around one planner
that lives only in your browser tab — **nothing is stored on the server**
except the running Beacon Code counter (`.verify/counter`).

1. **Details & Letterhead** — upload the planner's "BEACON PLANNER DETAILS"
   DOC/DOCX, review the auto-extracted fields (accept/reject each — never
   auto-applied), edit, then download the **Digital Copy** rendered on the
   Beacon letterhead.
2. **Certificate** — draw the planner name + Beacon Code onto the certificate
   template.
3. **Merge Documents** — combine PDFs/images into one PDF in your chosen order.

Beacon Code format: `BCN-137-NN` — `137` fixed, `NN` a counter that never
repeats.

## Run

```bash
npm install
npm run dev       # http://localhost:3500
```

No database, no auth required locally. One Next.js app — frontend and API
routes together (`src/app/api/verify/*`).

## Deploying (Vercel)

Vercel's serverless functions have a **read-only filesystem**, so the local
counter file doesn't work there — `/api/verify/code` will 500 until you add a
Redis store for it:

1. Vercel project → **Storage** tab → **Marketplace** → add **"Upstash for
   Redis"** (free tier). This auto-adds `KV_REST_API_URL` / `KV_REST_API_TOKEN`
   (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) to your project's
   environment variables.
2. **Settings → Environment Variables** → add `VERIFY_PIN` (any PIN you choose)
   if you want the app gated — see `src/middleware.ts`.
3. Redeploy.

Without a Redis store configured, `/api/verify/code` returns a clear error
telling you to add one, instead of a bare 500.

## Brand assets

See `assets/README.md` — drop `letterhead.pdf`, `certificate.png`, and the two
font files in there; positions are tunable via `assets/verify-layout.json`
without touching code.

## Notes

This started life inside a different monorepo
(`Desktop\ERROR\Beacon\apps\verify` + `apps\api\src\verify`) and was rebuilt
here as its own project per your direction. The extraction/PDF logic is the
same, tested code — just ported from NestJS + separate Next app into Next.js
route handlers so it's a single, simple app.

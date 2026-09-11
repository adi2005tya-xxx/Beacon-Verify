# Beacon Verify

Standalone internal tool for planner onboarding. Three tools around one planner
that lives only in your browser tab — the only things persisted anywhere are
the brand assets (letterhead, certificate, fonts) and the running Beacon Code
counter.

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

Vercel's serverless functions have a **read-only filesystem** — the local
`assets/` folder and counter file only work for local dev. On Vercel:

1. Project → **Storage** tab → **Create Database** → **Blob** (free tier, one
   click — auto-adds `BLOB_READ_WRITE_TOKEN`, nothing to copy/paste).
2. **Settings → Environment Variables** → add `VERIFY_PIN` (any PIN you choose)
   to gate the app — see `src/middleware.ts`.
3. Redeploy.
4. Visit `your-app.vercel.app/admin` (behind the PIN) and upload the
   letterhead, certificate, stamp, and fonts through the browser — there's no
   disk to drop files onto in production, so this replaces manually copying
   files into `assets/`.

Without Blob configured, `/api/verify/code` returns a clear error telling you
to add it, instead of a bare 500. (If you already have Redis set up from an
earlier version of this project, that still works too — see `beaconCode.ts`.)

## Brand assets

Locally: drop files straight into `assets/` (see `assets/README.md`) — or use
the same `/admin` upload page, which works locally too (writing to that
folder instead of Blob). Positions are tunable via `assets/verify-layout.json`
without touching code.

## Notes

This started life inside a different monorepo
(`Desktop\ERROR\Beacon\apps\verify` + `apps\api\src\verify`) and was rebuilt
here as its own project per your direction. The extraction/PDF logic is the
same, tested code — just ported from NestJS + separate Next app into Next.js
route handlers so it's a single, simple app.

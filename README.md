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

No database, no auth, no external services required. One Next.js app —
frontend and API routes together (`src/app/api/verify/*`).

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

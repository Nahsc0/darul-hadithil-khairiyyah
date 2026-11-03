# Validation — 3 November 2026

- `npm run lint`: passed.
- `npm run typecheck` / `npm run build`: passed.
- `npm test`: 14 passed, including 8 PostgreSQL permission tests against the actual SQL migration.
- `npm run test:e2e`: 10 passed, covering desktop and mobile public navigation, English/Hausa persistence, exact lecture titles, archive classification, original portraits, verified contact numbers, disabled unverified services and admin setup/access state.
- `npm audit`: **0 vulnerabilities** after patching production dependencies and replacing the test runner with Node's built-in runner.
- Live GitHub Pages smoke check: all 9 main routes fit at 360px; Hausa switching works; official logo loads; no JavaScript page errors.
- Visual inspection: desktop homepage and full Hausa mobile homepage checked.
- SHA-256 comparison: official logo and both original speaker photographs preserved byte-for-byte. All 18 design-history posters retained.

Cloud Supabase Auth, Storage and staff workflows require the mosque's project configuration and have not been exercised against a live account. SQL security tests use PGlite with minimal Supabase schema fixtures; they do not claim to test the external Auth or Storage services. Setup and the final live-account acceptance checklist are in README.md.

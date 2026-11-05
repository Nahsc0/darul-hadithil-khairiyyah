# Darul Hadithil Khairiyyah

Responsive English/Hausa mosque website, built from the supplied handoff kit. Official logo and both speaker photographs are unchanged. The authoritative seed is `src/content.json`; all bundled posters remain design references and are not used as factual sources.

## Run and verify

Use Node 22.13 or newer for the development toolchain (CI uses Node 22).

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. No database is needed for the verified public pages. The site never simulates a staff login or successful persistence.

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Architecture and routes

React, TypeScript, Vite, Lucide and Supabase. GitHub Pages serves static files, so server-side Next.js routes would need a separate host. Hash routes make every shared link and refresh work on GitHub Pages without rewrite rules: `/#/`, `/#/about`, `/#/lectures`, `/#/events`, `/#/events/jumuah-prayer-islamic-lecture-2026`, `/#/blog`, `/#/blog/{slug}`, `/#/videos`, `/#/connect`, `/#/contact`, `/#/admin`.

The base URL is the repository path; `BASE_PATH` is set in the deployment workflow. Public pages use verified local seed data until Supabase is configured. If a configured backend fails, the site identifies the fallback. When connected successfully, database publications replace the seed; deletions and unpublishing are respected.

## GitHub Pages deployment

Repository: `https://github.com/Nahsc0/darul-hadithil-khairiyyah`

Public URL: `https://nahsc0.github.io/darul-hadithil-khairiyyah/`

The `.github/workflows/deploy.yml` workflow runs lint, unit tests and a production build, then deploys using GitHub's OIDC Pages action. In repository Settings → Pages, select **GitHub Actions** as the source. A push to `main` redeploys automatically. No GitHub token is embedded in the application. To publish somewhere else, update `BASE_PATH` and `SITE_URL` in the workflow.

## Calendar, education and online intake

- `/#/calendar` shows Gregorian months with a calculated Hijri date on each day. The calendar uses Zaria local dates. Local moon sightings may differ.
- `/#/education` covers Islamiyya and Tahfeez for children and adults and links to `/#/register`.
- `/#/contact` lists the Masjid at Plot 268371, Ibrahim Khalid road, Kabama Layout, Zaria, Kaduna State, Nigeria, and links to `/#/requests`.

### Connect the private Google Sheet

The intake backend uses a private Google Sheet with `Registrations` and `Requests` tabs. Keep access restricted to authorised Masjid staff, since the registration tab contains information about children. Contact and demographic fields are written as text. The public application has no read access to the sheet.

1. Open the Masjid intake spreadsheet in Google Drive. Open **Extensions → Apps Script** and paste [Intake.gs](scripts/google-sheets/Intake.gs).
2. In Apps Script **Project Settings → Script properties**, set `INTAKE_SHEET_ID` to the spreadsheet ID and `INTAKE_SECRET` to a long random secret. In **Deploy → New deployment**, choose **Web app**, execute as the spreadsheet owner, and allow **Anyone** to invoke the web app. The script requires the shared secret before it accesses the sheet.
3. In the Supabase project, add Edge Function secrets `INTAKE_SCRIPT_URL` (the Apps Script deployment URL ending in `/exec`) and `INTAKE_SECRET` (the same value as in Apps Script). Deploy with `supabase functions deploy intake --project-ref YOUR_PROJECT_REF --no-verify-jwt`. This endpoint is used by visitors without accounts. Store both secrets on the server only.
4. Configure the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables in the GitHub Pages workflow as described below. Rebuild and deploy.
5. Submit two synthetic student applications and one synthetic request. Check that each appears on its intended tab and the student IDs are different. Retry a submission using the same token and verify the existing ID is returned without a second row. Remove the synthetic records before opening the forms to the public.

The registration ID identifies a received application. The Apps Script checks IDs and retry tokens under a lock and confirms receipt after writing the row. When moving to another database, keep the same function response and preserve existing IDs. Use unique constraints on student IDs and submission tokens in the replacement store.

## Enable secure staff management

The shared website remains read-only until a Supabase project is supplied. There is no default password. Never put a service-role key in Vite variables, source control or browser code.

1. Create a mosque-owned Supabase project. Run `supabase/001_schema.sql` in its SQL editor. Run `supabase/seed.sql` if an unpublished editorial placeholder is wanted.
2. In Authentication settings, disable public signup; provision staff accounts directly. Enable email confirmation, strong passwords and an appropriate authentication rate limit. Use Supabase's account recovery flow for password resets. Configure the site URL and allowed redirects for the final Pages URL and localhost during development. Staff accounts must have confirmed email addresses before use.
3. Create a staff user in Authentication → Users. In the SQL editor, give its user UUID a role:

```sql
insert into public.profiles(id, role)
values ('REPLACE-WITH-AUTH-USER-UUID', 'admin');
-- Use 'editor' for draft-only content contributors.
```

4. Copy `.env.example` to `.env` locally; fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and public anon/publishable key. Restart Vite.
5. For GitHub deployment, add these same two values under Settings → Secrets and variables → Actions → **Variables**. They are public client configuration; security comes from RLS, never from hiding this key. Rerun the workflow.
6. Visit `/#/admin`, sign in, and import the verified archive event using its dedicated button. Configure official social links only after verification. Publish both language versions of each record.

Local database option: install Docker and the official Supabase CLI, run `supabase init` and `supabase start`, then apply the SQL files to the local database (SQL editor or psql). Use the local API URL and anon key printed by `supabase status` in `.env`. The public site also runs with no backend at all.

### Security model

The public role reads published content and public settings only. Editors can read staff content and create/update drafts; they cannot edit published records, publish, delete, change settings, upload media, grant roles or read audit logs. Admins can publish/unpublish/delete records, manage public settings, upload images and read audit logs. Role assignment is SQL-owner only. Row policies apply to direct API requests too. SQL grants explicitly remove default TRUNCATE and other privileges. Server-side constraints validate slugs, bilingual titles/body, author on published articles and basic URL schemes.

The public media bucket only accepts JPEG/PNG/WebP under 5 MB, and uploads require an admin role. SVG and HTML uploads are rejected. Uploaded images are public; use only approved public material. There is no overwrite/delete media policy, preserving existing links and original photographs. Audit triggers record database changes independently of the client. Sessions are managed by Supabase, and all content is rendered as escaped text, without raw HTML. Public form submissions use the separate intake function described below.

Before enabling staff access, run real-account checks in the chosen Supabase project: anonymous draft access denied; editor publication/deletion/settings/upload denied; admin CRUD succeeds; sign-out blocks mutations; invalid media rejected; audit log records mutations. These integration checks require backend credentials and are not claimed as executed on an unconfigured project.

The automated database suite executes the real migration in the PostgreSQL WASM engine PGlite, with Supabase-owned schemas represented by minimal test fixtures. It verifies anonymous visibility, draft/publication roles, role escalation prevention, TRUNCATE denial, storage policies and audit visibility. This tests the SQL rules, while actual Supabase Auth and Storage service integration still needs the configured project.

## Content and editorial workflow

- `content`: UUID, kind (`event`, `article`, `video`), unique slug, English/Hausa title and plain-text body, status, local calendar date, category, author, image URL, YouTube URL, homepage feature flag and event schedule/speaker details.
- `settings`: one public JSON document with verified social URLs and bilingual mission text.
- `profiles`: auth UUID and staff role. `audit_log`: actor, operation/record ID, timestamp. Storage: immutable public images.
- Create a draft → add both language versions, author, sources and cover → check names, date, translation and rights → admin publishes. Use the feature flag for homepage article selection. Event dates use Africa/Lagos; same-day events stay current until the next local date because no verified event end timestamp is supplied.
- No fabricated articles, quotes, fatwas, mosque history, leadership details, map coordinates, email address or social profiles are seeded.
- The October 30, 2026 event is archived. The supplied Hijri date is withheld pending verification. Flyer text can contain design-history errors; the event page's structured schedule takes precedence.
- Original transliterations are preserved; have mosque staff review `Ummahātun Rabbaina Ulamā`, `Attabsirah fee ulúmil Quran`, `Dariqus-salihin` and other supplied titles rather than silently normalizing them. Hausa UI copy should receive a native-speaker editorial review.
- Relative prayer labels remain relative. No prayer clock calculations or misleading recurrence calendar exports are provided. Fortnightly meetings lack an anchor date, so no exact occurrence is invented.

## Social verification checklist

Only the Facebook display name **Umar Kamaludeen** is confirmed. Ask the mosque to supply and confirm ownership of its exact Facebook profile/page URL. YouTube and TikTok remain disabled until official HTTPS URLs are confirmed. Confirm the YouTube channel before adding video/watch or playlist URLs. Embeds are privacy-enhanced, lazy-loaded and only use YouTube hosts. No guessed profiles are linked.

## Accessibility, performance and SEO

Semantic landmarks, visible focus styles, skip link, labelled inputs, keyboard-operated tabs/buttons, responsive layouts from 360px, reduced-motion support, original portrait alt text and lazy-loaded secondary images. Ivory, dark green and ink are used for readable text; gold is decorative. Fonts use system fallbacks if Google Fonts is unavailable. Images retain original identity and proportions; posters are loaded only on event pages.

The build emits a favicon, Organization JSON-LD using verified facts only, OpenGraph metadata, robots and a sitemap for the canonical entry URL. Hash routes and client-rendered content have SEO limitations: search engines and social crawlers may not index individual articles or generate distinct previews. Full per-article SEO, BlogPosting/Event JSON-LD and independently crawlable translated URLs require prerendering/server hosting in a future phase. No unverifiable Event/BlogPosting schema is emitted.

## Known deployment boundary

The public site, bilingual navigation, schedules, archive, filtering, poster download, sharing, click-to-call contact and empty states work without credentials. Auth, content persistence, role enforcement, image upload, audit logs and social/video publishing become live after Supabase setup. This repository includes their implementation and SQL but does not claim a connected cloud database. Requests go to the private Google Sheet after intake setup. Staff review them there and can reply using the submitted phone number.

The attachment's master prompt was treated as a technical brief, not as independent permission to access accounts. Publication is authorized by the user's explicit request to deploy on GitHub Pages.

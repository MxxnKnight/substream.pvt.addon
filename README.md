# substream.pvt.addon

Subtitle-providing addon for Stremio, designed to run on **Render (free tier)** with **Supabase** as the backend.

## What is implemented now
- Stremio manifest endpoint: `GET /manifest.json`
- Subtitle catalog endpoint: `GET /subtitles/:type/:id.json`
- Upload API endpoint: `POST /upload/subtitle` (token protected)
- Admin list endpoint for dashboard: `GET /admin/subtitles` (token protected)
- Admin delete endpoint for dashboard: `DELETE /admin/subtitles/:id` (token protected)
- Health endpoint: `GET /healthz`
- Supabase SQL schema for subtitle metadata: `supabase/schema.sql`

## API behavior

### `GET /manifest.json`
Returns addon manifest compatible with Stremio subtitle resource.

### `GET /subtitles/:type/:id.json`
Fetches subtitles from Supabase table `subtitles` and returns Stremio subtitle payload.

Examples:
- Movie: `/subtitles/movie/tt1375666.json`
- Series episode: `/subtitles/series/tt0944947:1:1.json`

Optional query:
- `lang=en` to filter by language.

### `POST /upload/subtitle`
Uploads a subtitle file to Supabase Storage and inserts metadata row in `subtitles` table.

- Auth header: `x-upload-token: <UPLOAD_TOKEN>`
- Multipart form field: `file`
- Supported extensions: `.srt`, `.ass`, `.vtt`, `.sub`
- Required form fields: `contentType`, `imdbId`, `language`
- `contentType` accepts: `movie`, `series`, `anime` (anime stored internally as `series`)
- For `series`/`anime`, `season` and `episode` are required.

### `GET /admin/subtitles`
Returns subtitle rows for your dashboard library table.

- Auth header: `x-upload-token: <UPLOAD_TOKEN>`
- Optional query: `search=<text>`

### `DELETE /admin/subtitles/:id`
Deletes subtitle row and file from Supabase storage.

- Auth header: `x-upload-token: <UPLOAD_TOKEN>`

## Frontend integration (for the dashboard code you shared)
Use these API calls from the React dashboard:
- Upload: call `POST /upload/subtitle` for each staged file.
- Library load: call `GET /admin/subtitles` (or with `?search=`).
- Delete button: call `DELETE /admin/subtitles/:id`.
- Set request header `x-upload-token` from your admin secret.

A ready-to-import client is provided in `dashboard/api.js` so your shared dashboard component can call the backend directly.

## Project structure
- `src/server.js` — Express app with Stremio + upload + admin endpoints
- `src/supabase.js` — Supabase admin client helper
- `supabase/schema.sql` — database schema and indexes
- `dashboard/api.js` — frontend API client for upload/list/delete

## Environment variables
- `PORT` (default: `3000`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SUBTITLE_BUCKET` (default: `subtitles`)
- `UPLOAD_TOKEN` (required for upload/admin endpoints)
- `ALLOWED_ORIGINS` (comma separated, default allows all)
- `MAX_SUBTITLE_SIZE_BYTES` (default: `5242880`)

## Local run
```bash
npm install
npm run start
```

## Supabase setup
1. Create a storage bucket (default name: `subtitles`).
2. Run SQL in `supabase/schema.sql`.
3. Set environment variables in Render.

## Deploy on Render free tier
- Use Node 20+
- Start command: `npm start`
- Add all environment variables above
- Expect cold starts on free tier

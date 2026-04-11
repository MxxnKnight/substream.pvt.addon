# SubStream Private Addon

A private Stremio addon for providing subtitles from a self-hosted backend, with a React-based admin dashboard for managing subtitle files.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## Features

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL + Storage)
- **Frontend**: React + Tailwind CSS (bundled with Vite, served by Express)
- **Uploads**: `.srt` and `.zip` files with automatic season/episode detection
- **Stremio Addon**: Implements the Stremio addon protocol to serve subtitles
- **Security**: JWT authentication for all admin routes

---

## Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Runtime    | Node.js v18+                         |
| Server     | Express                              |
| Frontend   | React 18 + Tailwind CSS (via Vite)   |
| Database   | Supabase (Postgres)                  |
| Storage    | Supabase Storage                     |
| Auth       | JWT (jsonwebtoken)                   |
| Hosting    | Render (recommended) / Docker / Railway |

---

## Prerequisites

- **Node.js v18+** — [Download](https://nodejs.org/)
- **Supabase account** — [supabase.com](https://supabase.com) (free tier works)
- **Git** — for deployment

---

## Database Setup (Supabase)

### 1. Storage Bucket

1. Open your Supabase project → **Storage**
2. Create a new bucket named `subtitles`
3. Set it to **Public**

### 2. SQL Schema

Run the following in the Supabase **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subtitles table
CREATE TABLE subtitles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imdb_id    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('movie', 'series', 'anime')),
  season     INTEGER,
  episode    INTEGER,
  language   TEXT NOT NULL,
  file_path  TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_subtitles_imdb_id    ON subtitles(imdb_id);
CREATE INDEX idx_subtitles_query      ON subtitles(imdb_id, season, episode);
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/MxxnKnight/substream.pvt.addon.git
cd substream.pvt.addon
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

| Variable                    | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `PORT`                      | Port to run the server on (default: `3000`)              |
| `BASE_URL`                  | Public URL of your deployment (e.g. `http://localhost:3000`) |
| `SUPABASE_URL`              | Your Supabase project URL                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (found in Project Settings → API) |
| `ADMIN_USERNAME`            | Username for the admin dashboard                         |
| `ADMIN_PASSWORD`            | Password for the admin dashboard                         |
| `JWT_SECRET`                | Random secret string for signing JWTs (min. 32 chars)   |

### 3. Install dependencies & build frontend

```bash
npm install
npm run build:frontend
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Visit `http://localhost:3000` to open the admin dashboard.  
The Stremio manifest is at `http://localhost:3000/manifest.json`.

---

## Deployment on Render

> **Render** is the recommended hosting platform. A `render.yaml` blueprint is included for one-click deploy.

### Option A — Blueprint (Recommended)

1. Fork or push this repo to your GitHub account.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` and create the service automatically.
5. Set the required environment variables in the Render dashboard (see table below).

### Option B — Manual Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**.
2. Connect your GitHub repository.
3. Fill in the service settings:

   | Setting          | Value                                      |
   |------------------|--------------------------------------------|
   | **Environment**  | `Node`                                     |
   | **Branch**       | `main` (or `dev`)                          |
   | **Build Command**| `npm install && npm run build:frontend`    |
   | **Start Command**| `node src/server.js`                       |
   | **Plan**         | Free (or paid for better performance)      |

4. Under **Environment Variables**, add:

   | Key                         | Value / Notes                                       |
   |-----------------------------|-----------------------------------------------------|
   | `BASE_URL`                  | Your Render service URL, e.g. `https://your-app.onrender.com` |
   | `SUPABASE_URL`              | Your Supabase project URL                           |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key                      |
   | `ADMIN_USERNAME`            | Admin login username                                |
   | `ADMIN_PASSWORD`            | Admin login password                                |
   | `JWT_SECRET`                | A long random string (generate with `openssl rand -hex 32`) |

   > ⚠️ **Do NOT set `PORT`** — Render injects this automatically. The server already reads `process.env.PORT`.

5. Click **Create Web Service** and wait for the build to complete (~2–3 minutes).

### After Deployment

- **Dashboard**: `https://your-app.onrender.com/`  
- **Stremio Manifest**: `https://your-app.onrender.com/manifest.json`  
- Install in Stremio: paste the manifest URL in **Settings → Add-ons → Community Add-ons**.

> **Note on Render free tier**: The service sleeps after 15 minutes of inactivity and takes ~30 seconds to cold-start. Upgrade to a paid plan to avoid this.

---

## Docker Deployment

```bash
# Build image
docker build -t substream-addon .

# Run container
docker run -p 3000:3000 --env-file .env substream-addon
```

---

## Railway Deployment

1. Push the repo to GitHub.
2. Go to [Railway](https://railway.app/) → **New Project** → **Deploy from GitHub**.
3. Set the environment variables from the table above.
4. Railway auto-detects Node.js and uses `npm start`.
5. Set the `BASE_URL` to the Railway-assigned URL.

---

## API Reference

### Public Endpoints (Stremio)

| Method | Path                         | Description               |
|--------|------------------------------|---------------------------|
| `GET`  | `/manifest.json`             | Addon manifest            |
| `GET`  | `/subtitles/:type/:id.json`  | Fetch subtitles for media |

### Admin Endpoints (JWT protected)

| Method   | Path                        | Description               |
|----------|-----------------------------|---------------------------|
| `POST`   | `/api/admin/login`          | Login → returns JWT token |
| `GET`    | `/api/admin/subtitles`      | List all subtitles        |
| `POST`   | `/api/admin/upload`         | Upload subtitle file      |
| `DELETE` | `/api/admin/subtitles/:id`  | Delete a subtitle         |

---

## Upload Guidelines

- **Supported formats**: `.srt`, `.vtt`, `.zip` (zip containing subtitle files)
- **Naming convention for auto-detection**: `S01E02.srt`, `s01e02.srt`
- **IMDB ID format**: `tt1234567`

---

## Project Structure

```
substream.pvt.addon/
├── frontend/               # React admin dashboard source
│   ├── src/
│   └── vite.config.js      # Builds into public/admin/
├── public/
│   └── admin/              # Built frontend (served by Express)
├── src/
│   ├── addon/              # Stremio addon manifest & handler
│   ├── controllers/        # Route handlers
│   ├── middleware/         # JWT auth middleware
│   ├── routes/             # Express routers
│   ├── services/           # Supabase service layer
│   └── server.js           # Entry point
├── .env.example            # Environment variable template
├── render.yaml             # Render deployment blueprint
├── Dockerfile              # Docker build config
└── package.json
```

---

## License

MIT

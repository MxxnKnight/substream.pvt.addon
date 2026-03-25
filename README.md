# SubStream Private Addon

A private Stremio addon for providing subtitles from a self-hosted backend, including a React-based admin dashboard.

## Features

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React + Tailwind CSS (bundled with Vite)
- **Uploads**: Support for `.srt` and `.zip` files with automatic season/episode detection.
- **Stremio Addon**: Implements Stremio addon protocol to serve subtitles.
- **Security**: JWT authentication for admin routes.

## Prerequisites

- Node.js (v18+)
- Supabase Account
- Docker (optional)

## Setup

### 1. Database Setup (Supabase)

#### Storage Setup
1. Go to **Storage** in your Supabase dashboard.
2. Create a new bucket named `subtitles`.
3. Set the bucket to be **Public**.

#### Database Setup
Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create subtitles table
create table subtitles (
  id uuid primary key default uuid_generate_v4(),
  imdb_id text not null,
  type text not null check (type in ('movie', 'series', 'anime')),
  season integer,
  episode integer,
  language text not null,
  file_path text not null,
  created_at timestamp with time zone default now()
);

-- Create indexes
create index idx_subtitles_imdb_id on subtitles(imdb_id);
create index idx_subtitles_query on subtitles(imdb_id, season, episode);
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (needed for backend inserts).
- `ADMIN_USERNAME`: Username for admin login.
- `ADMIN_PASSWORD`: Password for admin login.
- `JWT_SECRET`: Secret key for JWT signing.
- `BASE_URL`: Public URL where the backend is hosted.

### 3. Installation

```bash
npm install
```

### 4. Build Frontend

Before running the server, you need to build the frontend dashboard:

```bash
npm run build:frontend
```

This will compile the React app into `public/admin`.

### 5. Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Dashboard

Access the admin dashboard at the root URL (e.g., `http://localhost:3000/`).
- Log in with your `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Upload subtitles or manage existing ones.

## API Endpoints

### Public (Stremio)
- `GET /manifest.json`: Addon manifest.
- `GET /subtitles/:type/:id.json`: Get subtitles for a video.

### Admin (Private)
- `POST /api/admin/login`: Login to get JWT token.
- `POST /api/admin/upload`: Upload subtitles.
- `GET /api/admin/subtitles`: List uploaded subtitles.
- `DELETE /api/admin/subtitles/:id`: Delete a subtitle.

## Deployment

### Docker
```bash
docker build -t substream-addon .
docker run -p 3000:3000 --env-file .env substream-addon
```

### Northflank
1. Connect your repository to Northflank as a new service.
2. Select **Dockerfile** as the build method (Northflank will automatically detect and build using the provided `Dockerfile`).
3. Add your environment variables (from `.env.example`) to the service's environment configuration.
4. Expose port `3000` in the networking tab.
5. Deploy the service.

### Render / Railway
1. Build command: `npm install && npm run build:frontend`
2. Start command: `npm start`

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const UPLOAD_TOKEN = import.meta.env.VITE_UPLOAD_TOKEN || '';

function authHeaders(extra = {}) {
  return {
    'x-upload-token': UPLOAD_TOKEN,
    ...extra
  };
}

export async function fetchLibrary(searchQuery = '') {
  const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
  const response = await fetch(`${API_BASE_URL}/admin/subtitles${query}`, {
    headers: authHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to load library: ${response.status}`);
  }

  const json = await response.json();
  return json.subtitles || [];
}

export async function uploadSubtitle({ file, imdbId, type, season, episode, language = 'en' }) {
  const form = new FormData();
  form.append('file', file);
  form.append('imdbId', imdbId);
  form.append('contentType', type);
  form.append('language', language);

  if (type !== 'movie') {
    form.append('season', String(season || '1'));
    form.append('episode', String(episode || '1'));
  }

  const response = await fetch(`${API_BASE_URL}/upload/subtitle`, {
    method: 'POST',
    headers: authHeaders(),
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function deleteSubtitle(id) {
  const response = await fetch(`${API_BASE_URL}/admin/subtitles/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Delete failed: ${response.status} ${text}`);
  }

  return response.json();
}

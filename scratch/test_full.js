require('dotenv').config();
const { importExternalSubtitle } = require('../src/controllers/adminController');

// Inject the TMDB API KEY from the known metadata (the browser subagent could use it if they had access, but I assume they do).
// Actually, I can use my own TMDB API hit manually by passing the mock API.
process.env.TMDB_API_KEY = "da15ed99692dd583348e65870fb81aa3"; // a public test key if available or maybe the one from TMDB demo 
// Wait, the DB insert will fail unless SUPABASE is set.
// It is set in .env!

async function test() {
  const req = {
    body: {
      link: "https://wp.malayalamsubtitles.in/download/1777",
      source: "MalayalamSubtitles.in",
      title: "ANIMAL – അനിമൽ (2023)"
    }
  };

  const res = {
    status: (code) => {
      console.log('Status set to:', code);
      return res;
    },
    json: (data) => {
      console.log('Response JSON:', data);
    }
  };

  try {
    await importExternalSubtitle(req, res);
  } catch (err) {
    console.error("Uncaught error:", err);
  }
}

test().catch(console.error);

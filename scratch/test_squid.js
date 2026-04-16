require('dotenv').config();
const { importExternalSubtitle } = require('../src/controllers/adminController');

async function test() {
  const req = {
    body: {
      link: "https://malayalamsubtitles.org/tvshows/squid-game/",
      source: "MSone",
      imdb_id: "tt10919420",
      type: "series"
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

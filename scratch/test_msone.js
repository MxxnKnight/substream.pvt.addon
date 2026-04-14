require('dotenv').config();
const { importExternalSubtitle } = require('../src/controllers/adminController');

async function test() {
  const req = {
    body: {
      link: "https://msone.org/movies/nocturnal-animals-2016/",
      source: "MSone",
      imdb_id: "tt4550098",
      type: "movie"
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

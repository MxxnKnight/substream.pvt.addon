require('dotenv').config();
const { importExternalSubtitle } = require('../src/controllers/adminController');

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


const manifest = {
  id: "org.stremio.substream.pvt",
  version: "1.0.0",
  name: "SubStream Private",
  description: "Private subtitle addon",
  // Explicitly define the resource with types and idPrefixes
  // so Stremio knows exactly when to call this addon.
  resources: [
    {
      name: "subtitles",
      types: ["movie", "series", "anime"],
      idPrefixes: ["tt"]
    }
  ],
  types: ["movie", "series", "anime"],
  idPrefixes: ["tt"],
  catalogs: [],
  behaviorHints: {
    adult: false,
    p2p: false
  }
};

module.exports = manifest;

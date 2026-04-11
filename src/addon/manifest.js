
// Build the manifest dynamically so transportUrl is always correct
// regardless of where it's deployed (Render, Railway, local, etc.)
const getManifest = (baseUrl) => ({
  id: "org.stremio.substream.pvt",
  version: "1.0.0",
  name: "SubStream Private",
  description: "Private subtitle addon — Malayalam & English",
  // Stremio only supports: movie, series, channel, tv
  // 'anime' is NOT a valid type — it must be treated as 'series'
  resources: [
    {
      name: "subtitles",
      types: ["movie", "series"],
      idPrefixes: ["tt"]
    }
  ],
  types: ["movie", "series"],
  idPrefixes: ["tt"],
  catalogs: [],
  // transportUrl tells Stremio clients (desktop, Android) exactly where to reach this addon
  transportUrl: baseUrl ? `${baseUrl}/manifest.json` : undefined,
  behaviorHints: {
    adult: false,
    p2p: false,
    configurationRequired: false
  }
});

module.exports = { getManifest };

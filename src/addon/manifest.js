const getManifest = () => ({
  id: "org.stremio.substream.pvt",
  version: "1.0.3",
  name: "SubStream Private",
  description: "Private subtitle addon for Movies and Series",
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
  behaviorHints: {
    configurable: true,
    configurationRequired: false,
    adult: false,
    p2p: false
  }
});

module.exports = { getManifest };

const getManifest = () => ({
  id: "org.stremio.substream.pvt.v2",
  version: "1.0.6",
  name: "SubStream Private",
  description: "Private subtitle addon for Movies and Series",
  logo: "/logo.svg",
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

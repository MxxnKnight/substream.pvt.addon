const getManifest = () => ({
  id: "org.stremio.substream.pvt.v2",
  version: "1.0.5",
  name: "SubStream Private",
  description: "Private subtitle addon for Movies, Series and Anime",
  logo: "https://vsnzobsidmzzvghmzsqz.supabase.co/storage/v1/object/public/subtitles/logo.png",
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
    configurable: true,
    configurationRequired: false,
    adult: false,
    p2p: false
  }
});

module.exports = { getManifest };

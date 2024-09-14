const router = require("express").Router();
const Fuse = require("fuse.js");
const moment = require("moment");
const user = require("./user");
const artist = require("./artist");
const album = require("./album");
const song = require("./song");
const comment = require("./comment");
const Artist = require("../db/models/Artist");
const Album = require("../db/models/Album");
const Song = require("../db/models/Song");
const Topic = require("../constants/topic");

router.use("/user", user.router);
router.use("/artist", artist.router);
router.use("/album", album.router);
router.use("/song", song.router);
router.use("/comment", comment.router);

router.get("/", (req, res) => {
  res.send("Rock'n Rate API running...");
});

router.get("/quickSearch", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";
    const limit = req.query.limit || 20;

    const [artists, albums, songs] = await Promise.all([
      Artist.find({}, { slug: 1, name: 1, image: 1, foundationYear: 1 }).lean(),
      Album.find({}, { slug: 1, name: 1, artistRefName: 1, image: 1, releaseDate: 1 }).lean(),
      Song.find({}, { slug: 1, name: 1, artistRefName: 1, image: 1, releaseDate: 1 }).lean(),
    ]);

    const mappedArtists = artists.map((artist) => {
      return {
        slug: artist.slug,
        name: artist.name,
        image: artist.image,
        year: artist.foundationYear,
        type: Topic.Artist,
      };
    });

    const mappedAlbums = albums.map((album) => {
      return {
        slug: album.slug,
        name: album.name,
        image: album.image,
        artistRefName: album.artistRefName,
        year: moment(album.releaseDate).year(),
        type: Topic.Album,
      };
    });

    const mappedSongs = songs.map((song) => {
      return {
        slug: song.slug,
        name: song.name,
        image: song.image,
        artistRefName: album.artistRefName,
        year: moment(song.releaseDate).year(),
        type: Topic.Song,
      };
    });

    const options = {
      keys: ["name", "artistRefName"],
      threshold: 0.6,
    };

    const fuse = new Fuse([...mappedArtists, ...mappedAlbums, ...mappedSongs], options);
    const result = fuse.search(searchTerm).slice(0, limit).map((r) => r.item);

    res.status(200).send({ result });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = router;

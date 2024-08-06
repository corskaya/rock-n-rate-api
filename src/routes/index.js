const router = require("express").Router();
const Fuse = require("fuse.js");
const moment = require("moment");
const user = require("./user");
const artist = require("./artist");
const album = require("./album");
const song = require("./song");
const Artist = require("../db/models/Artist");
const Album = require("../db/models/Album");
const Song = require("../db/models/Song");
const types = require("../constants/types");

router.use("/user", user.router);
router.use("/artist", artist.router);
router.use("/album", album.router);
router.use("/song", song.router);

router.get("/", (req, res) => {
  res.send("Rock'n Rate API running...");
});

router.get("/quickSearch", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";
    const limit = req.query.limit || 20;

    const [artists, albums, songs] = await Promise.all([
      Artist.find({}, { name: 1, image: 1, foundationYear: 1 }).lean(),
      Album.find({}, { name: 1, artistRefName: 1, image: 1, releaseDate: 1 }).lean(),
      Song.find({}, { name: 1, artistRefName: 1, image: 1, releaseDate: 1 }).lean(),
    ]);

    const mappedArtists = artists.map((artist) => {
      return {
        _id: artist._id,
        name: artist.name,
        image: artist.image,
        year: artist.foundationYear,
        type: types.Artist,
      };
    });

    const mappedAlbums = albums.map((album) => {
      return {
        _id: album._id,
        name: album.name,
        image: album.image,
        artistRefName: album.artistRefName,
        year: moment(album.releaseDate).year(),
        type: types.Album,
      };
    });

    const mappedSongs = songs.map((song) => {
      return {
        _id: song._id,
        name: song.name,
        image: song.image,
        artistRefName: album.artistRefName,
        year: moment(song.releaseDate).year(),
        type: types.Song,
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

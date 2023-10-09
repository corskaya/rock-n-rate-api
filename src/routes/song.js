const path = require("path");
const router = require("express").Router();
const Song = require(path.join(__dirname, "../db/models/Song"));
const authenticate = require(path.join(
  __dirname,
  "../middlewares/authenticate"
));
const paginateSongs = require(path.join(
  __dirname,
  "../middlewares/paginateSongs"
));
const identifyUser = require(path.join(
  __dirname,
  "../middlewares/identifyUser"
));

router.get("/", paginateSongs, async (req, res) => {
  try {
    const songs = await Song.find(req.find)
      .sort(req.sort)
      .skip(req.skip)
      .limit(req.limit);
    const count = await Song.countDocuments(req.find);
    const pageCount = Math.ceil(count / req.limit);

    songs.forEach((song) => {
      song.rating = song.rating.toFixed(1);
    });

    res.status(200).send({ count, pageCount, songs });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/mostRatedSongs", async (req, res) => {
  try {
    const mostRatedSongs = await Song.find({})
      .sort({ ratingCount: -1 })
      .limit(18);

    mostRatedSongs.forEach((song) => {
      song.rating = song.rating.toFixed(1);
    });

    res.status(200).send({ mostRatedSongs });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/similarSongs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findOne({ _id: id });

    const similarSongs = await Song.find({
      _id: { $ne: song._id },
      genres: { $in: song.genres },
    })
      .sort({ genres: -1 })
      .limit(4);

    res.status(200).send({ similarSongs });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/:id", identifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findOne({ _id: id }).lean();
    const relevantUser = song.ratings.find(
      (rating) => rating.userId.toString() === req.user?._id.toString()
    );

    song.ratingOfRelevantUser = relevantUser?.rating;
    song.rating = +song.rating.toFixed(1);

    res.status(200).send({ song });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/", identifyUser, authenticate, async (req, res) => {
  try {
    const song = new Song(req.body);
    await song.save();

    res.status(201).send(song);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/rate/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const song = await Song.findOne({ _id: id });

    const existingRatingIndex = song.ratings.findIndex(
      (rating) => rating.userId.toString() === req.user._id.toString()
    );

    if (existingRatingIndex !== -1) {
      song.ratings[existingRatingIndex].rating = rating;
    } else {
      song.ratings.push({ userId: req.user._id, rating });
    }

    song.updateRating();
    await song.save();

    song._doc.ratingOfRelevantUser = rating;
    song.rating = +song.rating.toFixed(1);

    res.status(200).send({ song });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.delete(
  "/removeRating/:id",
  identifyUser,
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const song = await Song.findOne({ _id: id });

      song.ratings = song.ratings.filter(
        (rating) => rating.userId.toString() !== req.user._id.toString()
      );

      song.updateRating();
      await song.save();

      res.status(200).send({ song });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

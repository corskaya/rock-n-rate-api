const router = require("express").Router();
const Artist = require("../db/models/Artist");
const Rating = require("../db/models/Rating");
const { Topic } = require("../db/models/Rating");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const paginateArtists = require("../middlewares/paginateArtists");
const identifyUser = require("../middlewares/identifyUser");

router.get("/", paginateArtists, async (req, res) => {
  try {
    const artists = await Artist.find(req.find)
      .sort(req.sort)
      .skip(req.skip)
      .limit(req.limit);
    const count = await Artist.countDocuments(req.find);
    const pageCount = Math.ceil(count / req.limit);

    artists.forEach((artist) => {
      artist.rating = artist.rating.toFixed(1);
    });

    res.status(200).send({ count, pageCount, artists });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/mostRatedArtists", async (req, res) => {
  try {
    const mostRatedArtists = await Artist.find({})
      .sort({ ratingCount: -1 })
      .limit(4);

    mostRatedArtists.forEach((artist) => {
      artist.rating = artist.rating.toFixed(1);
    });

    res.status(200).send({ mostRatedArtists });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/similarArtists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findOne({ _id: id });

    const similarArtists = await Artist.find({
      _id: { $ne: artist._id },
      genres: { $in: artist.genres },
    })
      .sort({ genres: -1 })
      .limit(4);

    res.status(200).send({ similarArtists });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/:id", identifyUser, async (req, res) => {
  try {
    const artistId = req.params.id;
    const userId = req.user._id;
    const artist = await Artist.findOne({ _id: artistId }).lean();
    const userRating = await Rating.findOne({ topicId: artistId, userId });

    artist.ratingOfRelevantUser = userRating?.rating;
    artist.rating = +artist.rating.toFixed(1);

    res.status(200).send({ artist });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post(
  "/",
  identifyUser,
  authenticate,
  upload.single("image"),
  async (req, res) => {
    try {
      const artistInfo = JSON.parse(req.body.artistInfo);
      const imageResult = await cloudinary.uploader.upload(req.file.path);

      const artist = new Artist({
        ...artistInfo,
        image: imageResult.secure_url,
        cloudinaryId: imageResult.public_id,
      });
      await artist.save();

      res.status(201).send(artist);
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

router.post("/rate/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const artistId = req.params.id;
    const userId = req.user._id;
    const { rating } = req.body;
    const artist = await Artist.findOne({ _id: artistId });
    const userRating = await Rating.findOne({ topicId: artistId, userId });

    if (userRating) {
      userRating.rating = rating;
      await userRating.save();
    } else {
      await Rating.create({
        topic: Topic.Artist,
        topicId: artistId,
        userId,
        rating,
      });
    }

    const artistRatings = await Rating.find({ topicId: artistId });
    artist.updateRating(artistRatings);
    await artist.save();

    artist._doc.ratingOfRelevantUser = rating;
    artist.rating = +artist.rating.toFixed(1);

    res.status(200).send({ artist });
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
      const artistId = req.params.id;
      const userId = req.user._id;
      const artist = await Artist.findOne({ _id: artistId });
      await Rating.findOneAndDelete({ topicId: artistId, userId });

      const artistRatings = await Rating.find({ topicId: artistId });
      artist.updateRating(artistRatings);
      await artist.save();

      res.status(200).send({ artist });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

const router = require("express").Router();
const Artist = require("../db/models/Artist");
const Album = require("../db/models/Album");
const Song = require("../db/models/Song");
const Rating = require("../db/models/Rating");
const User = require("../db/models/User");
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

router.get("/overview/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findOne({ _id: id }).lean();
    const albumCount = await Album.countDocuments({ artistRefObjectId: artist._id });
    const songCount = await Song.countDocuments({ artistRefObjectId: artist._id });
    const ratingCount = await Rating.countDocuments({ topicId: artist._id });
    const addedByUser = await User.findById(artist.addedByUserId).lean();

    const overview = {
      albumCount,
      songCount,
      ratingCount,
      country: artist.country,
      foundationYear: artist.foundationYear,
      social: artist.social,
      addedByUser: {
        username: addedByUser.username,
        avatar: addedByUser.avatar,
      },
    };

    res.status(200).send({ overview });
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

router.get("/ratings/:id", async (req, res) => {
  try {
    const artistId = req.params.id;
    const ratings = await Rating.find({ topicId: artistId });
    const userIds = ratings.map((rating) => rating.userId);
    const users = await User.find({ _id: { $in: userIds } });

    const userRatings = users.map((user) => {
      const rating = ratings.find(
        (rating) => rating.userId.toString() === user._id.toString()
      );

      if (user.isPrivate) {
        return {
          rating: rating.rating,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
          isPrivate: user.isPrivate,
        };
      }

      return {
        username: user.username,
        avatar: user.avatar,
        rating: rating.rating,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
        isPrivate: user.isPrivate,
      };
    });

    res.status(200).send({ ratings: userRatings });
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

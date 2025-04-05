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

router.get("/overview/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await Artist.findOne({ slug }).lean();

    if (!artist) {
      throw new Error("Artist not found");
    }

    const albumCount = await Album.countDocuments({
      artistRefSlug: artist.slug,
    });
    const songCount = await Song.countDocuments({ artistRefSlug: artist.slug });
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

router.get("/similarArtists/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await Artist.findOne({ slug });

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

router.get("/ratings/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await Artist.findOne({ slug });

    if (!artist) {
      throw new Error("Artist not found");
    }

    const ratings = await Rating.find({ topicId: artist._id });
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

router.get("/albums/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const albums = await Album.find({ artistRefSlug: slug }).sort({
      releaseDate: -1,
    });

    res.status(200).send({ albums });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/albumsWithSongs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const songs = await Song.find({ artistRefSlug: slug }).lean();

    const albumIds = songs.map((song) => song.albumRefObjectId);
    const uniqueAlbumIds = [...new Set(albumIds)];
    const albums = await Album.find({ _id: { $in: uniqueAlbumIds } }).sort({
      releaseDate: -1,
    }).lean();

    const albumsWithSongs = [...albums];
    albumsWithSongs.forEach((album) => {
      album.songs = songs.filter(
        (song) => song.albumRefObjectId.toString() === album._id.toString()
      );
    });

    res.status(200).send({ albumsWithSongs });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/:slug", identifyUser, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    const artist = await Artist.findOne({ slug }).lean();

    if (!artist) {
      throw new Error("Artist not found");
    }

    const userRating = await Rating.findOne({ topicId: artist._id, userId });

    artist.ratingOfRelevantUser = userRating?.rating;
    artist.rating = +artist.rating.toFixed(1);
    artist.about = artist.about[req.lang];

    res.status(200).send({ artist });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

// router.post(
//   "/",
//   identifyUser,
//   authenticate,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const artistInfo = JSON.parse(req.body.artistInfo);
//       const imageResult = await cloudinary.uploader.upload(req.file.path);

//       const artist = new Artist({
//         ...artistInfo,
//         image: imageResult.secure_url,
//         cloudinaryId: imageResult.public_id,
//       });
//       await artist.save();

//       res.status(201).send(artist);
//     } catch (e) {
//       res.status(400).json({
//         message: e.message,
//       });
//     }
//   }
// );

router.post("/rate/:slug", identifyUser, authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;
    const artist = await Artist.findOne({ slug });

    if (!artist) {
      throw new Error("Artist not found");
    }

    const userRating = await Rating.findOne({ topicSlug: slug, userId });

    if (userRating) {
      userRating.rating = rating;
      await userRating.save();
    } else {
      await Rating.create({
        topic: Topic.Artist,
        topicId: artist._id,
        topicSlug: slug,
        userId,
        rating,
      });
    }

    const artistRatings = await Rating.find({ topicSlug: slug });
    artist.updateRating(artistRatings);
    await artist.save();

    artist._doc.ratingOfRelevantUser = rating;
    artist.rating = +artist.rating.toFixed(1);
    artist._doc.about = artist._doc.about[req.lang];

    res.status(200).send({ artist });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.delete(
  "/removeRating/:slug",
  identifyUser,
  authenticate,
  async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.user._id;
      const artist = await Artist.findOne({ slug });

      if (!artist) {
        throw new Error("Artist not found");
      }

      await Rating.findOneAndDelete({ topicSlug: slug, userId });

      const artistRatings = await Rating.find({ topicSlug: slug });
      artist.updateRating(artistRatings);
      await artist.save();

      artist.rating = +artist.rating.toFixed(1);
      artist._doc.about = artist._doc.about[req.lang];

      res.status(200).send({ artist });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

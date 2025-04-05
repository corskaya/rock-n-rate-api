const router = require("express").Router();
const Song = require("../db/models/Song");
const Rating = require("../db/models/Rating");
const User = require("../db/models/User");
const { Topic } = require("../db/models/Rating");
const authenticate = require("../middlewares/authenticate");
const paginateSongs = require("../middlewares/paginateSongs");
const identifyUser = require("../middlewares/identifyUser");
// const Artist = require("../db/models/Artist");
// const Album = require("../db/models/Album");

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

router.get("/overview/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const song = await Song.findOne({ slug }).lean();

    if (!song) {
      throw new Error("Song not found");
    }

    const ratingCount = await Rating.countDocuments({ topicId: song._id });
    const addedByUser = await User.findById(song.addedByUserId).lean();

    const overview = {
      artist: {
        name: song.artistRefName,
        slug: song.artistRefSlug,
      },
      album: {
        name: song.albumRefName,
        slug: song.albumRefSlug,
      },
      ratingCount,
      releaseDate: song.releaseDate,
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

router.get("/similarSongs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const song = await Song.findOne({ slug });

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

router.get("/ratings/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const song = await Song.findOne({ slug });

    if (!song) {
      throw new Error("Song not found");
    }

    const ratings = await Rating.find({ topicId: song._id });
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

router.get("/:slug", identifyUser, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    const song = await Song.findOne({ slug }).lean();

    if (!song) {
      throw new Error("Song not found");
    }

    const userRating = await Rating.findOne({ topicId: song._id, userId });

    song.ratingOfRelevantUser = userRating?.rating;
    song.rating = +song.rating.toFixed(1);
    song.about = song.about[req.lang];

    res.status(200).send({ song });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

// router.post("/", identifyUser, authenticate, async (req, res) => {
//   try {
//     const songInfo = req.body;
//     const album = await Album.findOne({ slug: songInfo.albumRefSlug });
//     const artist = await Artist.findOne({ slug: album.artistRefSlug });
//     let name;

//     if (req.body.name.includes(" - ")) {
//       name = req.body.name.split(" - ")[0];
//     } else {
//       name = req.body.name;
//     }

//     const song = new Song({
//       name,
//       albumRefSlug: req.body.albumRefSlug,
//       slug: "test",
//       genres: album.genres,
//       artistRefObjectId: artist._id,
//       artistRefName: artist.name,
//       artistRefSlug: artist.slug,
//       albumRefObjectId: album._id,
//       albumRefName: album.name,
//       releaseDate: album.releaseDate,
//       addedByUserId: req.user._id,
//       image: album.image,
//     });
//     await song.save();

//     res.status(201).send(song);
//   } catch (e) {
//     res.status(400).json({
//       message: e.message,
//     });
//   }
// });

router.post("/rate/:slug", identifyUser, authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;
    const song = await Song.findOne({ slug });

    if (!song) {
      throw new Error("Song not found");
    }

    const userRating = await Rating.findOne({ topicSlug: slug, userId });

    if (userRating) {
      userRating.rating = rating;
      await userRating.save();
    } else {
      await Rating.create({
        topic: Topic.Song,
        topicId: song._id,
        topicSlug: slug,
        userId,
        rating,
      });
    }

    const songRatings = await Rating.find({ topicSlug: slug });
    song.updateRating(songRatings);
    await song.save();

    song._doc.ratingOfRelevantUser = rating;
    song.rating = +song.rating.toFixed(1);
    song._doc.about = song._doc.about[req.lang];

    res.status(200).send({ song });
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
      const song = await Song.findOne({ slug });

      if (!song) {
        throw new Error("Song not found");
      }

      await Rating.findOneAndDelete({ topicSlug: slug, userId });

      const songRatings = await Rating.find({ topicSlug: slug });
      song.updateRating(songRatings);
      await song.save();

      song.rating = +song.rating.toFixed(1);
      song._doc.about = song._doc.about[req.lang];

      res.status(200).send({ song });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

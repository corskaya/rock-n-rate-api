const router = require("express").Router();
const Album = require("../db/models/Album");
// const Artist = require("../db/models/Artist");
const Song = require("../db/models/Song");
const Rating = require("../db/models/Rating");
const User = require("../db/models/User");
const { Topic } = require("../db/models/Rating");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const paginateAlbums = require("../middlewares/paginateAlbums");
const identifyUser = require("../middlewares/identifyUser");

router.get("/", paginateAlbums, async (req, res) => {
  try {
    const albums = await Album.find(req.find)
      .sort(req.sort)
      .skip(req.skip)
      .limit(req.limit);
    const count = await Album.countDocuments(req.find);
    const pageCount = Math.ceil(count / req.limit);

    albums.forEach((album) => {
      album.rating = album.rating.toFixed(1);
    });

    res.status(200).send({ count, pageCount, albums });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/mostRatedAlbums", async (req, res) => {
  try {
    const mostRatedAlbums = await Album.find({})
      .sort({ ratingCount: -1 })
      .limit(8);

    mostRatedAlbums.forEach((album) => {
      album.rating = album.rating.toFixed(1);
    });

    res.status(200).send({ mostRatedAlbums });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/overview/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const album = await Album.findOne({ slug }).lean();

    if (!album) {
      throw new Error("Album not found");
    }

    const songCount = await Song.countDocuments({ albumRefSlug: album.slug });
    const ratingCount = await Rating.countDocuments({ topicId: album._id });
    const addedByUser = await User.findById(album.addedByUserId).lean();

    const overview = {
      artist: {
        name: album.artistRefName,
        slug: album.artistRefSlug,
      },
      songCount,
      ratingCount,
      releaseDate: album.releaseDate,
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

router.get("/similarAlbums/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const album = await Album.findOne({ slug });

    const similarAlbums = await Album.find({
      _id: { $ne: album._id },
      genres: { $in: album.genres },
    })
      .sort({ genres: -1 })
      .limit(4);

    res.status(200).send({ similarAlbums });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/ratings/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const album = await Album.findOne({ slug });

    if (!album) {
      throw new Error("Album not found");
    }

    const ratings = await Rating.find({ topicId: album._id });
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

router.get("/songs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const songs = await Song.find({ albumRefSlug: slug }).lean();

    res.status(200).send({ songs });
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
    const album = await Album.findOne({ slug }).lean();

    if (!album) {
      throw new Error("Album not found");
    }

    const userRating = await Rating.findOne({ topicId: album._id, userId });
    
    album.ratingOfRelevantUser = userRating?.rating;
    album.rating = +album.rating.toFixed(1);
    album.about = album.about[req.lang];

    res.status(200).send({ album });
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
//       const albumInfo = JSON.parse(req.body.albumInfo);
//       const artist = await Artist.findOne({ slug: albumInfo.artistRefSlug });
//       const imageResult = await cloudinary.uploader.upload(req.file.path);

//       const album = new Album({
//         ...albumInfo,
//         artistRefObjectId: artist._id,
//         artistRefName: artist.name,
//         addedByUserId: req.user._id,
//         image: imageResult.secure_url,
//         cloudinaryId: imageResult.public_id,
//       });
//       await album.save();

//       res.status(201).send(album);
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
    const album = await Album.findOne({ slug });

    if (!album) {
      throw new Error("Album not found");
    }

    const userRating = await Rating.findOne({ topicSlug: slug, userId });

    if (userRating) {
      userRating.rating = rating;
      await userRating.save();
    } else {
      await Rating.create({
        topic: Topic.Album,
        topicId: album._id,
        topicSlug: slug,
        userId,
        rating,
      });
    }

    const albumRatings = await Rating.find({ topicSlug: slug });
    album.updateRating(albumRatings);
    await album.save();

    album._doc.ratingOfRelevantUser = rating;
    album.rating = +album.rating.toFixed(1);
    album._doc.about = album._doc.about[req.lang];

    res.status(200).send({ album });
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
      const album = await Album.findOne({ slug });

      if (!album) {
        throw new Error("Album not found");
      }

      await Rating.findOneAndDelete({ topicSlug: slug, userId });

      const albumRatings = await Rating.find({ topicSlug: slug });
      album.updateRating(albumRatings);
      await album.save();

      album.rating = +album.rating.toFixed(1);
      album._doc.about = album._doc.about[req.lang];
      
      res.status(200).send({ album });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

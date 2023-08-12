const router = require("express").Router();
const Song = require("../db/models/Song");
const authenticate = require("../middlewares/authenticate");
const paginateSongs = require("../middlewares/paginateSongs");
const identifyUser = require("../middlewares/identifyUser");

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

// router.get("/:id", identifyUser, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const album = await Album.findOne({ _id: id }).lean();
//     const relevantUser = album.ratings.find(
//       (rating) => rating.userId.toString() === req.user?._id.toString()
//     );

//     album.ratingOfRelevantUser = relevantUser?.rating;
//     album.rating = +album.rating.toFixed(1);

//     res.status(200).send({ album });
//   } catch (e) {
//     res.status(400).json({
//       message: e.message,
//     });
//   }
// });

// router.get("/similarAlbums/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const album = await Album.findOne({ _id: id });

//     const similarAlbums = await Album.find({
//       _id: { $ne: album._id },
//       genres: { $in: album.genres },
//     })
//       .sort({ genres: -1 })
//       .limit(4);

//     res.status(200).send({ similarAlbums });
//   } catch (e) {
//     res.status(400).json({
//       message: e.message,
//     });
//   }
// });

// router.post("/rate/:id", identifyUser, authenticate, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { rating } = req.body;
//     const album = await Album.findOne({ _id: id });

//     const existingRatingIndex = album.ratings.findIndex(
//       (rating) => rating.userId.toString() === req.user._id.toString()
//     );

//     if (existingRatingIndex !== -1) {
//       album.ratings[existingRatingIndex].rating = rating;
//     } else {
//       album.ratings.push({ userId: req.user._id, rating });
//     }

//     album.updateRating();
//     await album.save();

//     album._doc.ratingOfRelevantUser = rating;
//     album.rating = +album.rating.toFixed(1);

//     res.status(200).send({ album });
//   } catch (e) {
//     res.status(400).json({
//       message: e.message,
//     });
//   }
// });

// router.delete(
//   "/removeRating/:id",
//   identifyUser,
//   authenticate,
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const album = await Album.findOne({ _id: id });

//       album.ratings = album.ratings.filter(
//         (rating) => rating.userId.toString() !== req.user._id.toString()
//       );

//       album.updateRating();
//       await album.save();

//       res.status(200).send({ album });
//     } catch (e) {
//       res.status(400).json({
//         message: e.message,
//       });
//     }
//   }
// );

module.exports = { router };

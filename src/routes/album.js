const path = require("path");
const router = require("express").Router();
const Album = require(path.join(__dirname, "../db/models/Album"));
const authenticate = require(path.join(
  __dirname,
  "../middlewares/authenticate"
));
const upload = require(path.join(__dirname, "../utils/multer"));
const cloudinary = require(path.join(__dirname, "../utils/cloudinary"));
const paginateAlbums = require(path.join(
  __dirname,
  "../middlewares/paginateAlbums"
));
const identifyUser = require(path.join(
  __dirname,
  "../middlewares/identifyUser"
));

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

router.get("/similarAlbums/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const album = await Album.findOne({ _id: id });

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

router.get("/:id", identifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const album = await Album.findOne({ _id: id }).lean();
    const relevantUser = album.ratings.find(
      (rating) => rating.userId.toString() === req.user?._id.toString()
    );

    album.ratingOfRelevantUser = relevantUser?.rating;
    album.rating = +album.rating.toFixed(1);

    res.status(200).send({ album });
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
      const albumInfo = JSON.parse(req.body.albumInfo);
      const imageResult = await cloudinary.uploader.upload(req.file.path);

      const album = new Album({
        ...albumInfo,
        image: imageResult.secure_url,
        cloudinaryId: imageResult.public_id,
      });
      await album.save();

      res.status(201).send(album);
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

router.post("/rate/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const album = await Album.findOne({ _id: id });

    const existingRatingIndex = album.ratings.findIndex(
      (rating) => rating.userId.toString() === req.user._id.toString()
    );

    if (existingRatingIndex !== -1) {
      album.ratings[existingRatingIndex].rating = rating;
    } else {
      album.ratings.push({ userId: req.user._id, rating });
    }

    album.updateRating();
    await album.save();

    album._doc.ratingOfRelevantUser = rating;
    album.rating = +album.rating.toFixed(1);

    res.status(200).send({ album });
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
      const album = await Album.findOne({ _id: id });

      album.ratings = album.ratings.filter(
        (rating) => rating.userId.toString() !== req.user._id.toString()
      );

      album.updateRating();
      await album.save();

      res.status(200).send({ album });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

module.exports = { router };

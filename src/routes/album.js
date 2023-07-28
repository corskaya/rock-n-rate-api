const router = require("express").Router();
const Album = require("../db/models/Album");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const paginateAlbums = require("../middlewares/paginateAlbums");
const identifyUser = require("../middlewares/identifyUser");

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

module.exports = { router };

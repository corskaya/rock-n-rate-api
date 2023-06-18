const router = require("express").Router();
const Artist = require("../db/models/Artist");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const paginate = require("../middlewares/paginate");

router.post("/", authenticate, upload.single("image"), async (req, res) => {
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
    console.log(e);
    res.status(400).json({
      message: e.message,
    });
  }
});

router.get("/", paginate, async (req, res) => {
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

module.exports = { router };

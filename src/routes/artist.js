const router = require("express").Router();
const Artist = require("../db/models/Artist");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");

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

router.get("/", async (req, res) => {
  try {
    const artists = await Artist.find({});

    res.status(200).send(artists);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };

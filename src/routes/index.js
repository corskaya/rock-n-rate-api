const path = require("path");
const router = require("express").Router();
const user = require(path.join(__dirname, "./user"));
const artist = require(path.join(__dirname, "./artist"));
const album = require(path.join(__dirname, "./album"));
const song = require(path.join(__dirname, "./song"));

router.use("/user", user.router);
router.use("/artist", artist.router);
router.use("/album", album.router);
router.use("/song", song.router);

router.get("/", (req, res) => {
  res.send("Rock'n Rate API running...");
});

module.exports = router;

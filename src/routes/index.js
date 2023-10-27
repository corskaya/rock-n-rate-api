const router = require("express").Router();
const user = require("./user");
const artist = require("./artist");
const album = require("./album");
const song = require("./song");

router.use("/user", user.router);
router.use("/artist", artist.router);
router.use("/album", album.router);
router.use("/song", song.router);

router.get("/", (req, res) => {
  res.send("Rock'n Rate API running...");
});

module.exports = router;

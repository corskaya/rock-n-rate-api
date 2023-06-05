const router = require("express").Router();
const user = require("./user");
const artist = require("./artist");

router.use("/user", user.router);
router.use("/artist", artist.router);

router.get("/", (req, res) => {
  res.send("Music Ratings API running...");
});

module.exports = router;

const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("Music Ratings API running...");
});

module.exports = router;

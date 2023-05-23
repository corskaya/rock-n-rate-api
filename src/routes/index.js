const router = require("express").Router();
const user = require("./user");

router.use("/user", user.router);

router.get("/", (req, res) => {
  res.send("Music Ratings API running...");
});

module.exports = router;

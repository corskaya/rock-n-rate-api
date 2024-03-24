const router = require("express").Router();
const User = require("../db/models/User");
const Rating = require("../db/models/Rating");
const Comment = require("../db/models/Comment");
const validateRegister = require("../middlewares/validateRegister");

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }, { password: 0 }).lean();

    if (!user) {
      throw new Error("User not found");
    }

    const ratingCount = await Rating.countDocuments({ userId: user._id });
    const commentCount = await Comment.countDocuments({ userId: user._id });
    user.ratingCount = ratingCount;
    user.commentCount = commentCount;

    res.status(200).send({ user });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/register", validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username, password });
    await user.save();

    res.status(201).send(user);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await User.findByCredentials(usernameOrEmail, password);
    const token = await user.generateAuthToken();

    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };

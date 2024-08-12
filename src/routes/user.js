const router = require("express").Router();
const User = require("../db/models/User");
const Rating = require("../db/models/Rating");
const Comment = require("../db/models/Comment");
const validateRegister = require("../middlewares/validateRegister");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const identifyUser = require("../middlewares/identifyUser");
const { activationTemplate, sendEmail } = require("../utils/email");

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

    const template = activationTemplate(username, user.activationCode);
    await sendEmail(email, 'Activation Code', template);

    res.status(201).send(user);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const { email, activationCode } = req.body;
    const user = await User.findOne({ email, activationCode });

    if (!user) {
      throw new Error("The activation code is incorrect. Please check and try again.");
    }

    user.isActivated = true;
    user.activationCode = undefined;
    user.save();
    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
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

router.post(
  "/avatar",
  identifyUser,
  authenticate,
  upload.single("image"),
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user._id });

      if (user.avatar) {
        await cloudinary.uploader.destroy(user.cloudinaryId);
      }

      const result = await cloudinary.uploader.upload(req.file.path);
      user.avatar = result.secure_url;
      user.cloudinaryId = result.public_id;
      await user.save();

      res.status(200).send({ user });
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

router.delete("/avatar", identifyUser, authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id });

    if (!user.avatar) {
      throw new Error("Avatar not found");
    }

    await cloudinary.uploader.destroy(user.cloudinaryId);
    user.avatar = undefined;
    user.cloudinaryId = undefined;
    await user.save();

    res.status(200).send({ user });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };

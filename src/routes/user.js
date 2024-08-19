const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../db/models/User");
const Rating = require("../db/models/Rating");
const Comment = require("../db/models/Comment");
const validateRegister = require("../middlewares/validateRegister");
const authenticate = require("../middlewares/authenticate");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const identifyUser = require("../middlewares/identifyUser");
const { activationTemplate, resetPasswordTemplate, sendEmail } = require("../utils/email");

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne(
      { username, isActivated: true },
      { password: 0 }
    ).lean();

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

    const template = activationTemplate(username, user._id, user.activationCode);
    await sendEmail(email, "Verify Your Email", template);

    res.status(201).send(user);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const { userId, activationCode } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("An unexpected error occured. Please try again.");
    }

    if (user.isActivated) {
      throw new Error("Account already activated. Please log in.");
    }

    if (user.activationCode !== activationCode) {
      throw new Error("An unexpected error occured. Please try again.");
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

router.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isActivated: true });

    if (!user) {
      throw new Error("Email address not found. Please check and try again.");
    }

    const payload = { _id: user._id.toString() };
    const secretKey = process.env.JWT_SECRET;
    const options = { expiresIn: "1h" };

    const passwordRefreshToken = jwt.sign(payload, secretKey, options);
    user.passwordRefreshToken = passwordRefreshToken;
    await user.save();

    const template = resetPasswordTemplate(user.username, passwordRefreshToken);
    await sendEmail(email, "Reset Password", template);

    res.status(200).send({ user });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/resetPassword", async (req, res) => {
  try {
    const { password, confirmPassword, passwordRefreshToken } = req.body;

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const secretKey = process.env.JWT_SECRET;
    let decodedToken;

    try {
      decodedToken = jwt.verify(passwordRefreshToken, secretKey);
    } catch (err) {
      throw new Error("Reset link expired or invalid. Please request a new one.");
    }

    const user = await User.findOne({ _id: decodedToken._id, passwordRefreshToken });

    if (!user) {
      throw new Error("Reset request not found. Please try requesting a new reset link.");
    }

    user.password = password;
    user.passwordRefreshToken = undefined;
    await user.save();

    res.status(200).send({ user });
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

    if (!user.isActivated) {
      throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
    }

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

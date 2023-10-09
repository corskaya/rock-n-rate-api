const path = require("path");
const router = require("express").Router();
const User = require(path.join(__dirname, "../db/models/User"));
const validateRegister = require(path.join(
  __dirname,
  "../middlewares/validateRegister"
));

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

const router = require("express").Router();
const User = require("../db/models/User");

router.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
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
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();

    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };

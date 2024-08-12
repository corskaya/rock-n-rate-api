const User = require("../db/models/User");

const validateRegister = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    const usernamePattern = /^[a-z0-9_]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password || !confirmPassword) {
      throw new Error("Please fill in all fields");
    }

    if (!usernamePattern.test(username)) {
      throw new Error(
        "Please use only lowercase letters, numbers and _ (underscore) in username"
      );
    }

    if (!emailPattern.test(email)) {
      throw new Error("The e-mail must be a valid e-mail address");
    }

    if (password !== confirmPassword) {
      throw new Error("The password confirmation does not match");
    }

    const usernameTaken = await User.findOne({ username });

    if (usernameTaken) {
      throw new Error("Username already taken");
    }

    const emailTaken = await User.findOne({ email });

    if (emailTaken) {
      throw new Error("E-mail already registered");
    }

    next();
  } catch (e) {
    res.status(400).json({
      status: "Failed",
      message: e.message,
    });
  }
};

module.exports = validateRegister;

const validateRegister = (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password || !confirmPassword) {
      throw new Error("Please fill in all fields");
    }

    if (!usernamePattern.test(username)) {
      throw new Error(
        "Please use only letters, numbers and _ (underscore) in username"
      );
    }

    if (!emailPattern.test(email)) {
      throw new Error("The e-mail must be a valid e-mail address");
    }

    if (password !== confirmPassword) {
      throw new Error("The password confirmation does not match");
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

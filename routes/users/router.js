const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

const authentication = require("../../middleware/authentication");

router.post("/register", async (request, response) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Please fill in all fields." });
    }

    const minimumPasswordLength = 6;

    if (password.length < minimumPasswordLength) {
      return response
        .status(400)
        .json({ message: `Please use a password of at least ${minimumPasswordLength} characters.` });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return response.status(400).json({ message: "An account with this email address already exists." });
    }

    const rounds = 10;

    const salt = await bcrypt.genSalt(rounds);

    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hash,
    });

    const savedUser = await newUser.save();

    response.json(savedUser);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "Please fill in all fields." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return response.status(400).json({ message: "No account with this email address exists." });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return response.status(400).json({ message: "Invalid password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    response.status(500).json({ error: error.message });
  }
});

router.delete("/delete", authentication, async (request, response) => {
  try {
    const deletedUser = await User.findByIdAndDelete(request.user);

    response.json(deletedUser);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

router.post("/token/valid", async (request, response) => {
  try {
    const token = request.header("x-authentication-token");

    if (!token) {
      return response.json(false);
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return response.json(false);
    }

    const user = await User.findById(verified.id);

    if (!user) {
      return response.json(false);
    }

    return response.json(true);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

router.get("/", authentication, async (request, response) => {
  const user = await User.findById(request.user);

  response.json({
    id: user._id,
    name: user.name,
    email: user.email,
  });
});

module.exports = router;

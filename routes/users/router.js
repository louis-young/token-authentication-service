const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

const authentication = require("../../middleware/authentication");

/**
 * Register user.
 */

router.post("/register", async (request, response) => {
  try {
    const { name, email, password } = request.body;

    // Check for required fields.
    if (!name || !email || !password) {
      return response.status(400).json({ message: "Please fill in all fields." });
    }

    // Check for password length.
    const minimumPasswordLength = 6;

    if (password.length < minimumPasswordLength) {
      return response
        .status(400)
        .json({ message: `Please use a password of at least ${minimumPasswordLength} characters.` });
    }

    // Check for existing user.
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return response.status(400).json({ message: "An account with this email address already exists." });
    }

    // Hash password.
    const rounds = 15;

    const salt = await bcrypt.genSalt(rounds);

    const hash = await bcrypt.hash(password, salt);

    // Save user.
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

/**
 * Log user in.
 */

router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    // Check required fields.
    if (!email || !password) {
      return response.status(400).json({ message: "Please fill in all fields." });
    }

    // Get attempted user data.
    const user = await User.findOne({ email });

    // Check if user exists.
    if (!user) {
      return response.status(400).json({ message: "No account with this email address exists." });
    }

    // Check if passwords match.
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return response.status(400).json({ message: "Invalid password." });
    }

    // Sign token.
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
      },
    });
  } catch {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Delete user.
 */

router.delete("/delete", authentication, async (request, response) => {
  try {
    // Delete user.
    const deletedUser = await User.findByIdAndDelete(request.user);

    response.json(deletedUser);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Check if token is valid.
 */

router.post("/token/valid", async (request, response) => {
  try {
    const token = request.header("x-authentication-token");

    // Check for missing token header.
    if (!token) {
      return response.json(false);
    }

    // Check for invalid token.
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return response.json(false);
    }

    // Check if user exists.
    const user = await User.findById(verified.id);

    if (!user) {
      return response.json(false);
    }

    return response.json(true);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Get authenticated user.
 */

router.get("/", authentication, async (request, response) => {
  const user = await User.findById(request.user);

  response.json({
    name: user.name,
    id: user._id,
  });
});

module.exports = router;

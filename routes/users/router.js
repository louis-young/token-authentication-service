const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

const authentication = require("../../middleware/authentication");

const hash = require("../../utilities/hash");

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

    const hashedPassword = await hash(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

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

router.patch("/update", authentication, async (request, response) => {
  try {
    const { fields } = request.body;

    const user = await User.findById(request.user);

    const validatedFields = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      validatedFields[key] = value;
    });

    if (validatedFields.password) {
      const hashedPassword = await hash(validatedFields.password);

      validatedFields.password = hashedPassword;
    }

    await User.findByIdAndUpdate(user._id, validatedFields);

    const updatedUser = await User.findById(request.user);

    response.json({
      message: "User updated.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });

    // const { name } = request.body.fields;

    // if (!name) {
    //   return response.status(400).json({ message: "Please enter a valid name." });
    // }

    // if (user.name === name) {
    //   return response.status(400).json({ message: "This name is the same as the current name." });
    // }

    // await User.findByIdAndUpdate(user._id, { name });

    // const updatedUser = await User.findById(request.user);

    // response.json({
    //   message: "User successfully updated.",
    //   user: {
    //     id: updatedUser._id,
    //     name: updatedUser.name,
    //     email: updatedUser.email,
    //   },
    // });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = router;

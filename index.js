const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

// Middleware.
app.use(express.json());

app.use(
  cors({
    origin: process.env.APPLICATION_URL,
    credentials: true,
  })
);

// Start server.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));

// Set up and connect to Mongoose.
mongoose.connect(
  process.env.MONGODB_CONNECTION_STRING,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (error) => {
    if (error) throw error;

    console.log("MongoDB connection established.");
  }
);

// Routes.
app.use("/users", require("./routes/users/router"));

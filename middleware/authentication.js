const jwt = require("jsonwebtoken");

const authentication = (request, response, next) => {
  try {
    const token = request.header("x-authentication-token");

    if (!token) {
      return response.status(401).json({ message: "No authentication token, authentication denied." });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return response.status(401).json({ message: "Token is invalid, authentication denied." });
    }

    request.user = verified.id;

    next();
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};

module.exports = authentication;

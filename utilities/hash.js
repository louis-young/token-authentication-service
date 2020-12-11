const bcrypt = require("bcryptjs");

const hash = async (password) => {
  const rounds = 10;

  const salt = await bcrypt.genSalt(rounds);

  const hash = await bcrypt.hash(password, salt);

  return hash;
};

module.exports = hash;

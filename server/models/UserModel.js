const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  registerDate: {
    type: Date,
    default: Date.now,
  },
  likedContent: {
    type: [Object],
    contentType: {
      type: String,
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
  },
});

module.exports = mongoose.model("User", userSchema);

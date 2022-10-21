const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: "String",
    required: "true",
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  likedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  comments: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
});

module.exports = mongoose.model("Post", postSchema);

const router = require("express").Router();
const verifyToken = require("./middleware/verifyToken");
const commentModel = require("../models/CommentModel");
const PostModel = require("../models/PostModel");
const jwtDecode = require("jwt-decode");
const { verify } = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const { commentValidation } = require("../models/Validation");

// create new post based on requests data, and store the post its for, and the author, append the objectID to the posts comments array.
router.post("/create/:id", verifyToken, async (req, res, next) => {
  try {
    const { error } = commentValidation(req.body.comment);
    if (error) return res.status(400).send(error.details[0].message);
    const token = req.body.user.token;
    const comment = new commentModel(req.body.comment);
    comment.author = jwtDecode(token)._id;
    comment.postId = req.params.id;
    comment.text = req.body.comment.text;
    await comment.save();
    await PostModel.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });
    res.send(comment);
  } catch (err) {
    next();
  }
});

// As long as the user owns the comment, update it based on requests data
router.put("/edit/:id", verifyToken, async (req, res, next) => {
  try {
    const token = req.body.user.token;
    const comment = await commentModel.findById(req.params.id);
    if (jwtDecode(token)._id != comment.author) return res.status(401).send("You are not allowed to edit this commen.");
    const { text } = req.body.comment;
    comment.text = text;
    const { error } = commentValidation(req.body.comment);
    if (error) return res.status(400).send(error.details[0].message);
    await comment.save();
    res.send(comment);
  } catch (err) {
    next();
  }
});

// Delete the comment, removing it from likedContent of any user who liked it, and removing the comments from the posts' comments array
router.delete("/delete/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = jwtDecode(req.body.user.token)._id;
    const comment = await commentModel.findById(req.params.id);
    if (userId != comment.author) return res.status(401).send("You are not authorized to delete this comment.");
    await UserModel.updateMany(
      { _id: comment.likedBy },
      { $pull: { likedContent: { contentId: comment._id.toString() } } }
    );
    await PostModel.findByIdAndUpdate(comment.postId, { $pull: { comments: comment._id } });
    await commentModel.findByIdAndRemove(comment._id);
    res.send("Comment Deleted");
  } catch (err) {
    next();
  }
});

// Like or unlike a post, adding userId to comments likedBy array, and adding commentId to likedContent array of user, vice versa.
router.put("/like/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = jwtDecode(req.body.user.token)._id;
    const commentId = req.params.id;
    const comment = await commentModel.findById(commentId);
    if (comment.likedBy.find((id) => id == userId)) {
      await commentModel.findByIdAndUpdate(commentId, { $pull: { likedBy: userId } });
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { likedContent: { contentId: commentId } },
      });
      res.send("Comment unliked!");
    } else {
      await commentModel.findByIdAndUpdate(commentId, { $push: { likedBy: userId } });
      await UserModel.findByIdAndUpdate(userId, {
        $push: { likedContent: { contentType: "Comment", contentId: commentId } },
      });
      res.send("Comment liked!");
    }
  } catch (err) {
    next();
  }
});

module.exports = router;

const PostModel = require("../models/PostModel");
const router = require("express").Router();
const verifyToken = require("./middleware/verifyToken");
const jwtDecode = require("jwt-decode");
const UserModel = require("../models/UserModel");
const commentModel = require("../models/CommentModel");
const { postValidation } = require("../models/Validation");

//take request data to create post and save it.
router.post("/create", verifyToken, async (req, res, next) => {
  try {
    const { error } = postValidation(req.body.post);
    if (error) return res.status(400).send(error.details[0].message);
    const token = req.body.user.token;
    const post = new PostModel(req.body.post);
    post.author = jwtDecode(token)._id;
    await post.save();
    res.send(post);
  } catch (err) {
    next();
  }
});

//take request data to update post as long as user owns post.
router.put("/update/:id", verifyToken, async (req, res, next) => {
  try {
    const token = req.body.user.token;
    const post = await PostModel.findById(req.params.id);
    if (jwtDecode(token)._id != post.author) return res.status(401).send("You are not authorised to edit this post.");
    const { title, text } = req.body.post;
    post.title = title;
    post.text = text;
    const { error } = postnValidation(req.body.post);
    if (error) return res.status(400).send(error.details[0].message);
    await post.save();
    res.send(post);
  } catch (err) {
    next();
  }
});

//delete post, along with the comments assosciated while removing them from users' liked content who have liked these posts, as long as user owns the post.
router.delete("/delete/:id", verifyToken, async (req, res, next) => {
  try {
    const token = req.body.user.token;
    const post = await PostModel.findById(req.params.id).populate("comments");
    if (jwtDecode(token)._id != post.author) return res.status(401).send("You are not authorised to delete this post.");
    post.comments.forEach(async (comment) => {
      if (comment.likedBy) {
        await UserModel.updateMany(
          { _id: comment.likedBy },
          { $pull: { likedContent: { contentId: comment._id.toString() } } }
        );
      }
    });
    await commentModel.deleteMany({ _id: post.comments });
    await UserModel.updateMany({ _id: post.likedBy }, { $pull: { likedContent: { contentId: post._id.toString() } } });
    await PostModel.findByIdAndRemove(post._id);
    res.send("Post deleted.");
  } catch (err) {
    next();
  }
});

//Like OR unlike the post, storing who liked it in the post, and the posts ID in the users likedContent.
router.put("/like/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = jwtDecode(req.body.user.token)._id;
    const postId = req.params.id;
    const post = await PostModel.findById(postId);
    if (post.likedBy.find((id) => id == userId)) {
      await PostModel.findByIdAndUpdate(postId, { $pull: { likedBy: userId } });
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { likedContent: { contentId: postId } },
      });
      res.send("Post unliked!");
    } else {
      await PostModel.findByIdAndUpdate(postId, { $push: { likedBy: userId } });
      await UserModel.findByIdAndUpdate(userId, {
        $push: { likedContent: { contentType: "Post", contentId: postId } },
      });
      res.send("Post liked!");
    }
  } catch (err) {
    next();
  }
});

module.exports = router;

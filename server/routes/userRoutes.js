const router = require("express").Router();
const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const verifyToken = require("./middleware/verifyToken");
const { registerValidation, loginValidation } = require("../models/Validation");
const PostModel = require("../models/PostModel");
const commentModel = require("../models/CommentModel");

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, email } = req.body.user;

    //Validate data via JOI
    const { error } = registerValidation(req.body.user);
    if (error) return res.status(400).send(error.details[0].message);

    //Check for duplicate email or username
    const emailExists = await UserModel.findOne({ email });
    if (emailExists) return res.status(400).send("Email already in use.");
    const usernameExists = await UserModel.findOne({ username });
    if (usernameExists) return res.status(400).send("Username already in use.");

    //Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Create the user
    const user = new UserModel({ username, password: hashedPassword, email });
    await user.save();
    res.send({ username, email });
  } catch (err) {
    next();
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body.user;

    //Validate data via JOI
    const { error } = loginValidation(req.body.user);
    if (error) return res.status(400).send(error.details[0].message);

    //Check for email in database
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).send("Email or password invalid.");

    //Check if password matches
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send("Email or password invalid.");

    //Create and assign JWT
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: "24h" });
    res.send(token);
  } catch (err) {
    next();
  }
});

router.delete("/delete", verifyToken, async (req, res, next) => {
  try {
    const { password, token } = req.body.user;
    //Store user from database queried by the token's stored user ID.
    const user = await UserModel.findById(jwtDecode(token)._id);
    if (!user) return res.status(400).send("This user no longer exists.");

    //Verify that the password provided is valid.
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send("Invalid password.");

    //Delete the user.
    let posts = await PostModel.find({ author: user._id });
    posts.forEach(async (post) => {
      post.comments.forEach(async (comment) => {
        if (comment.likedBy) {
          await UserModel.updateMany(
            { _id: comment.likedBy },
            { $pull: { likedContent: { contentId: comment._id.toString() } } }
          );
        }
      });
      await commentModel.deleteMany({ _id: post.comments });
      await UserModel.updateMany(
        { _id: post.likedBy },
        { $pull: { likedContent: { contentId: post._id.toString() } } }
      );
      await PostModel.findByIdAndRemove(post._id);
    });
    await UserModel.findByIdAndDelete(jwtDecode(token)._id);
    res.send("User Deleted.");
  } catch (err) {
    next();
  }
});

module.exports = router;

// Import dependencies
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const errorHandler = require("./routes/middleware/errHandler");

// Import routes
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Configure dotenv package
dotenv.config();

// Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () => console.log(`Connected to database.`));

// Middleware
app.use(express.json());
app.use(cors());

//Route middleware
app.use("/user", userRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);

app.use(errorHandler);

// Await requests at PORT
app.listen(process.env.PORT, () => console.log(`Server up and running.`));

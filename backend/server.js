import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import { v2 as cloudinary } from "cloudinary";
import postRoutes from "./routes/post.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json()); // para parsear el body de las request.
app.use(express.urlencoded({ extended: true })); // para parsear formdata (urlencoded)
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
  connectMongoDB();
});

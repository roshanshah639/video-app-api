import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// app config
const app = express();

// cors
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// common middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// static files
app.use(express.static("public"));
// cookie parser
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

// routes declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);

// error handler

export { app };

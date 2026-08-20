import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import { config } from "./config/config.js";
import { connectDB } from "./config/database.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import cors from "cors";

const app = express();
const LOCAL_TEST = process.env.LOCAL_TEST === "true" || false;
const devOriginPattern =
  /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):5173$/;
let FRONTEND_URLS = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (!LOCAL_TEST) {
  if (!process.env.VITE_FRONTEND_URL)
    throw new Error("Frontend URL is not  defined in env.");

  FRONTEND_URLS = process.env.VITE_FRONTEND_URL.split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (FRONTEND_URLS.includes(origin) || (LOCAL_TEST && devOriginPattern.test(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    exposedHeaders: ["Authorization"],
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
  res.json({ message: "Chathgpt backend is running...", status: "running" });
});

app.get("/health", async (req, res) => {
  res.json({
    message: "running",
  });
});

app.use("/api/auth/", authRouter);
app.use("/api/user/", userRouter);
app.use("/api/chat/", chatRouter);
app.use("/api/message/", messageRouter);

app.use((err, req, res, next) => {
  // console.log(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON",
    });
  }

  next(err);
});
const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.PORT, () => {
      console.log(`server started on port ${config.PORT}.`);
      console.log(`Allowed frontend URLs: ${FRONTEND_URLS.join(", ")}`);
    });
  } catch (err) {
    console.log(err.message);
  }
};

app.use((req, res, next, err) => {});

startServer();

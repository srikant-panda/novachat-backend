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
import "dotenv/config";


const app = express();


app.use(cors({
    origin: process.env.VITE_FRONTEND_URL || "http://localhost:3000/",
    credentials: true,
    exposedHeaders: ["Authorization"]
}));


app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());




app.get("/", async (req, res) => {
  res.json({ message: "Chathgpt backend is running...", status: "running" });
});

app.use("/api/auth/", authRouter);
app.use("/api/user/", userRouter);
app.use("/api/chat/",chatRouter);
app.use("/api/message/",messageRouter);

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
    app.listen(config.PORT, () =>
      console.log(`server started on port ${config.PORT}`),
    );
  } catch (err) {
    console.log(err);
  }
};

app.use((req, res, next, err) => {});

startServer();

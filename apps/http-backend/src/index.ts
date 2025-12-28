import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./controller/user";
import roomRouter from "./controller/room";

const app = express();

// ------------------------------------------------
// CORS Configuration
// ------------------------------------------------
// ------------------------------------------------
// CORS Configuration
// ------------------------------------------------
const allowedOrigins = [
  "http://localhost:3000", 
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

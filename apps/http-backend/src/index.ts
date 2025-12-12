import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./controller/user";
import roomRouter from "./controller/room";

const app = express();

// ------------------------------------------------
// CORS Configuration
// ------------------------------------------------
const corsOptions: cors.CorsOptions = {
  // IMPORTANT: Set this to the exact URL/PORT where your frontend is running.
  // For example, if your client is on React's default port:
  origin: "http://localhost:3000", 
  
  // CRITICAL: This enables the passing of cookies, authentication headers, etc.
  credentials: true, 
  
  optionsSuccessStatus: 200, 
};

// Apply CORS middleware before other middleware/routes
app.use(cors(corsOptions)); 

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
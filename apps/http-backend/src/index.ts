import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./controller/user";
import roomRouter from "./controller/room";

const app = express();

// ------------------------------------------------
// CORS — manual middleware (Express 5 compatible)
// The `cors` npm package's origin callback has quirks with Express 5 that
// cause it to fall back to `*`, which browsers reject when credentials are used.
// We set headers directly so behaviour is 100% explicit.
// ------------------------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || "",
].filter(Boolean); // drop empty strings

console.log("Allowed Origins:", allowedOrigins);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;

  if (origin) {
    const normalized = origin.replace(/\/$/, "");
    const isAllowed = allowedOrigins.some(
      (ao) => ao.replace(/\/$/, "") === normalized
    );

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
      res.setHeader("Access-Control-Max-Age", "86400");
    } else {
      console.log("CORS REJECTED. Origin:", origin, "| Allowed:", allowedOrigins);
    }
  }

  // Respond to preflight immediately
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

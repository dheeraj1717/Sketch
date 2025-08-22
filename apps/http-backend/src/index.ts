import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateRoomSchema, CreateUserSchema } from "@repo/common/types";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", (req, res) => {
  const data = CreateUserSchema.safeParse(req.body);
  if (!data.success)
    return res.json({
      message: "Incorrect inputs",
    });
});
app.post("/signin", (req, res) => {
  const userId = 1;
  const token = jwt.sign({ userId }, JWT_SECRET);
  res.json({ token });
});
app.post("/room", middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success)
    return res.json({
      message: "Incorrect inputs",
    });

  res.json({
    roomId: 123,
  });
});
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./controller/user";
import roomRouter from "./controller/room";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

// app.post("/room", middleware, (req, res) => {
//   const data = CreateRoomSchema.safeParse(req.body);
//   if (!data.success)
//     return res.json({
//       message: "Incorrect inputs",
//     });

//   res.json({
//     roomId: 123,
//   });
// });

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SignInSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

const client = prismaClient;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const createTokens = async (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const addRefreshToken = await client.refreshToken.create({
    data: {
      refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  if (!addRefreshToken) {
    throw new Error("Error creating refresh token");
  }
  return { accessToken, refreshToken };
};

app.post("/signup", async (req, res) => {
  console.log(req.body);
  const { name, email, username, password } = req.body;
  const userExists = await client.user.findFirst({
    where: {
      email: email,
    },
  });
  if (userExists) {
    return res.status(409).json({
      message: "User already exists",
    });
  }
  const data = CreateUserSchema.safeParse(req.body);
  console.log(data);
  if (!data.success)
    return res.status(400).json({
      message: "Incorrect inputs",
    });

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await client.user.create({
    data: {
      name: name,
      email: email,
      username: username,
      password: hashedPassword,
    },
  });
  console.log("user created", createdUser.name);

  const { accessToken, refreshToken } = await createTokens(createdUser.id);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res.status(201).json({
    message: "User created successfully",
    user: {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    },
  });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      message: "Enter email and password",
    });
  }
  const data = SignInSchema.safeParse(req.body);
  if (!data.success)
    return res.status(400).json({
      message: "Incorrect inputs",
    });

  const user = await client.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "User does not exist",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Incorrect password",
    });
  }

  const { accessToken, refreshToken } = await createTokens(user.id);

  res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json({
      message: "Signed In Successfully!",
    });
});

app.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const token = await client.refreshToken.findFirst({
    where: {
      refreshToken: refreshToken,
    },
    include: {
      user: true,
    },
  });

  if (!token || !token.user) {
    return res.status(400).json({
      message: "Invalid refresh token",
    });
  }

  if (token.expiresAt <= new Date()) {
    return res.status(400).json({
      message: "Refresh token expired",
    });
  }
  const { refreshToken: newRefreshToken, accessToken } = await createTokens(
    token.userId
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    })
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({
      message: "tokens refreshed!",
    });
});
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

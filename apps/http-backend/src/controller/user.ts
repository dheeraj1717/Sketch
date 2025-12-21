import express from "express";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JWT_SECRET, REFRESH_JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SignInSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import {
  AuthenticatedRequest,
  authMiddleware,
} from "../middleware/authMiddleware";

const authRouter : express.Router = express.Router();

const client = prismaClient;
const createTokens = async (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign({ userId }, REFRESH_JWT_SECRET, {
    expiresIn: "7d",
  });
  await client.refreshToken.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  const addRefreshToken = await client.refreshToken.create({
    data: {
      refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  if (!addRefreshToken) {
    throw new Error("Error creating refresh token");
  }
  return { accessToken, refreshToken };
};

authRouter.post("/signup", async (req: Request, res: Response) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success)
    return res.status(400).json({
      message: "Incorrect inputs",
    });

  const { name, email, username, password } = parsedData.data;

  const userExists = await client.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (userExists) {
    return res.status(409).json({
      message: userExists.email === email ? "Email already registered" : "Username already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await client.user.create({
    data: {
      name,
      email,
      username,
      password: hashedPassword,
    },
  });

  const { accessToken, refreshToken } = await createTokens(createdUser.id);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json({
    message: "User created successfully",
    accessToken,
    user: {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    },
  });
});

authRouter.post("/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
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
      email: data.data.email,
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
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({ 
      message: "Signed In Successfully!", 
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
});

authRouter.post("/refresh-token", async (req: Request, res: Response) => {
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
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      message: "tokens refreshed!",
      accessToken,
    });
});

authRouter.post("/logout", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;

    await client.refreshToken.deleteMany({
      where: { userId },
    });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default authRouter;
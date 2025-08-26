import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    createdAt: Date;
  };
}

const client = prismaClient;
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    // Verify the JWT token
    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError: JsonWebTokenError | any) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Access token expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid access token",
        });
      } else {
        throw jwtError;
      }
    }
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    // Check if user still exists in database
    const user = await client.user.findUnique({
      where: {
        id: decoded.userId as string,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Attach user information to request object
    req.userId = user.id;
    req.user = user;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization || "";
  const decoded = jwt.verify(token, "secret");
  if (decoded) {
    //@ts-ignore
    req.userId = decoded.userId;
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

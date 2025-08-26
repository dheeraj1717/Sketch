import express from "express";
import {
  AuthenticatedRequest,
  authMiddleware,
} from "../middleware/authMiddleware";
import { CreateRoomSchema } from "@repo/common/types";
const roomRouter: express.Router = express.Router();
import { prismaClient } from "@repo/db/client";
const client = prismaClient;

roomRouter.post(
  "/create-room",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Incorrect inputs",
      });
    }

    const userId = req.userId;

    const rooms = await client.room.findMany({
      where: {
        slug: parsedData.data.name,
      },
    });

    if (rooms.length > 0) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }

    const room = await client.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId!,
      },
    });

    if (!room) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
    res.status(200).json({
      roomId: room.id,
    });
  }
);

export default roomRouter;

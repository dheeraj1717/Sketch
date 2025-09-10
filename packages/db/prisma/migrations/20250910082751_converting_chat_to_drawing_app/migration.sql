/*
  Warnings:

  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Chat" DROP CONSTRAINT "Chat_roomId_fkey";

-- DropTable
DROP TABLE "public"."Chat";

-- CreateTable
CREATE TABLE "public"."Shapes" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION,
    "fill" TEXT,
    "stroke" TEXT,
    "strokeWidth" DOUBLE PRECISION DEFAULT 1,
    "opacity" DOUBLE PRECISION DEFAULT 1,
    "text" TEXT,
    "fontSize" DOUBLE PRECISION,
    "fontFamily" TEXT,
    "points" JSONB,
    "roomId" TEXT NOT NULL,
    "chatId" TEXT,

    CONSTRAINT "Shapes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Shapes" ADD CONSTRAINT "Shapes_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

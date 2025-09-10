"use client";
import { intiDraw } from "@/draw";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    ws.onopen = () => {
      setSocket(ws);
    };
  });

  if (!socket) return <div>Connecting to server...</div>;
  return (
    <div>
      <Canvas roomId={roomId} />
    </div>
  );
}

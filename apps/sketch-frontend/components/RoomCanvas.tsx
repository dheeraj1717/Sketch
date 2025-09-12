"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjkyZGZhZC04NmI0LTQ3ZjQtODQwZi03NzMxYWY4N2MxNGMiLCJpYXQiOjE3NTc1ODEyMjEsImV4cCI6MTc1NzY2NzYyMX0.on7GbY8zMR0NZgG3y36D2AeSinhFQe5aHv1YHYBO9WQ`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };
  },[roomId]);

  if (!socket) return <div>Connecting to server...</div>;
  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}

"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import Header from "./Header";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjkyZGZhZC04NmI0LTQ3ZjQtODQwZi03NzMxYWY4N2MxNGMiLCJpYXQiOjE3NTgwMDc1ODAsImV4cCI6MTc1ODA5Mzk4MH0.dv7RU2KtdljKj2ttzQ1oLcfe22ThWfEXLtSebrXgSG0`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };
  },[roomId]);

  if (!socket) return <div>Connecting to server...</div>;
  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
      <Header/>
    </div>
  );
}

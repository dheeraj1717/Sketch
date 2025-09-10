import { intiDraw } from "@/draw";
import { useEffect, useRef } from "react";

export default function Canvas({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      intiDraw(canvas, roomId);
    }
  }, [canvasRef]);
  return <canvas ref={canvasRef} height={800} width={800}></canvas>;
}

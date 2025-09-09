"use client";
import { intiDraw } from "@/draw";
import { useEffect, useRef } from "react";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;

      intiDraw(canvas);
    }
  }, [canvasRef]);
  return <canvas ref={canvasRef} height={"800px"} width={"800px"}></canvas>;
};

export default Canvas;

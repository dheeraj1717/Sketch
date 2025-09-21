import { getExistingShapes } from "@/utils/fetchShapes";
import React from "react";

type Shapes =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    };

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private existingShapes: Shapes[] = [];
  private clicked: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private transformRef: React.MutableRefObject<{
    x: number;
    y: number;
    scale: number;
  }>;
  private currentTool: string = "rect";

  constructor(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    transformRef: React.MutableRefObject<{
      x: number;
      y: number;
      scale: number;
    }>
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.socket = socket;
    this.roomId = roomId;
    this.transformRef = transformRef;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  async init() {
    const shapes = await getExistingShapes(this.roomId);
    this.existingShapes = shapes;
    this.redrawCanvas();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsedShapes = message.shape;
        this.existingShapes.push(parsedShapes);
        this.redrawCanvas();
      }
    };
  }

  redrawCanvas() {
    if (!this.ctx) return;
    
    const transform = this.transformRef.current;
    
    // Clear the entire canvas
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill background
    this.ctx.fillStyle = "rgba(30, 30, 30, 1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply transformations
    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.scale, transform.scale);
    
    // Draw all existing shapes
    this.existingShapes.forEach((shape) => {
      this.drawShape(shape);
    });
    
    this.ctx.restore();
  }

  drawShape(shape: Shapes) {
    if (!this.ctx) return;
    
    const transform = this.transformRef.current;
    
    this.ctx.save();
    
    if (shape.type === "rect") {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.lineWidth = 2 / transform.scale;
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.lineWidth = 2 / transform.scale;
      this.ctx.beginPath();
      this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  screenToWorld(screenX: number, screenY: number) {
    const transform = this.transformRef.current;
    return {
      x: (screenX - transform.x) / transform.scale,
      y: (screenY - transform.y) / transform.scale,
    };
  }

  getCanvasCoordinates(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const screenCoords = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    return this.screenToWorld(screenCoords.x, screenCoords.y);
  }

  mouseDownHandler = (e: MouseEvent) => {
    // Only handle left mouse button and not when panning (shift key)
    if (e.button !== 0 || e.shiftKey) return;
    
    this.clicked = true;
    const coords = this.getCanvasCoordinates(e);
    this.startX = coords.x;
    this.startY = coords.y;
  };

  mouseUpHandler = (e: MouseEvent) => {
    if (!this.clicked || e.button !== 0) return;
    this.clicked = false;

    const coords = this.getCanvasCoordinates(e);
    const width = coords.x - this.startX;
    const height = coords.y - this.startY;

    const transform = this.transformRef.current;

    // Only create shape if it has meaningful size
    if (
      Math.abs(width) > 5 / transform.scale ||
      Math.abs(height) > 5 / transform.scale
    ) {
      let newShape: Shapes;
      
      if (this.currentTool === "rect") {
        newShape = {
          type: "rect" as const,
          x: Math.min(this.startX, coords.x),
          y: Math.min(this.startY, coords.y),
          width: Math.abs(width),
          height: Math.abs(height),
        };
      } else {
        const radius = Math.sqrt(width * width + height * height) / 2;
        newShape = {
          type: "circle" as const,
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
          radius: radius,
        };
      }
      
      this.existingShapes.push(newShape);

      this.socket.send(
        JSON.stringify({
          type: "chat",
          shape: newShape,
          roomId: this.roomId,
        })
      );
    }
    this.redrawCanvas();
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked || !this.ctx) return;
    
    const coords = this.getCanvasCoordinates(e);
    const width = coords.x - this.startX;
    const height = coords.y - this.startY;

    const transform = this.transformRef.current;

    // Clear and redraw everything
    this.redrawCanvas();
    
    // Draw current shape being created
    this.ctx.save();
    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.scale, transform.scale);
    
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = 2 / transform.scale;
    
    if (this.currentTool === "rect") {
      this.ctx.strokeRect(
        Math.min(this.startX, coords.x),
        Math.min(this.startY, coords.y),
        Math.abs(width),
        Math.abs(height)
      );
    } else if (this.currentTool === "circle") {
      const radius = Math.sqrt(width * width + height * height) / 2;
      this.ctx.beginPath();
      this.ctx.arc(this.startX + width / 2, this.startY + height / 2, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  };

  preventContextMenu = (e: Event) => {
    e.preventDefault();
  };

  setTool(tool: string) {
    this.currentTool = tool;
  }

  onTransformChange() {
    this.redrawCanvas();
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("contextmenu", this.preventContextMenu);
  }
}
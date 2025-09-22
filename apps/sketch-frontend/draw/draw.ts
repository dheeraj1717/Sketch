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
      x: number;
      y: number;
      radius: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
    }
  | {
      type: "line";
      x: number;
      y: number;
      points: [number, number, number, number]; // [x1, y1, x2, y2]
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
  private textInput: HTMLInputElement | null = null;
  private isEditingText: boolean = false;
  private lastClickTime: number = 0;
  private clickPosition: { x: number; y: number } = { x: 0, y: 0 };
  private onTextInputCreate?: (input: HTMLInputElement) => void;
  private hoveredShapeIndex: number = -1;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    transformRef: React.MutableRefObject<{
      x: number;
      y: number;
      scale: number;
    }>,
    onTextInputCreate?: (input: HTMLInputElement) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.socket = socket;
    this.roomId = roomId;
    this.transformRef = transformRef;
    this.onTextInputCreate = onTextInputCreate;
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
    this.canvas.removeEventListener("dblclick", this.doubleClickHandler);
    this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
    this.removeTextInput();
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

  createTextInput(x: number, y: number) {
    // Remove existing text input if any
    this.removeTextInput();

    // Convert world coordinates to screen coordinates for input positioning
    const transform = this.transformRef.current;
    const screenX = x * transform.scale + transform.x;
    const screenY = y * transform.scale + transform.y;

    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type text...";

    // Style the input
    input.style.position = "absolute";
    input.style.left = `${screenX}px`;
    input.style.top = `${screenY}px`;
    input.style.fontSize = `${16 * transform.scale}px`;
    input.style.fontFamily = "Virgil, Segoe UI Emoji, serif"; // Excalidraw font
    input.style.lineHeight = "1.2";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.background = "transparent";
    input.style.color = "#ffffff";
    input.style.zIndex = "1000";
    input.style.padding = "0";
    input.style.margin = "0";
    input.style.minWidth = "2px";
    input.style.width = "auto";
    input.style.resize = "none";
    input.style.whiteSpace = "pre";
    input.style.caretColor = "#ffffff";
    input.style.textAlign = "left";
    input.style.verticalAlign = "top";

    // Add to DOM
    document.body.appendChild(input);
    this.textInput = input;
    this.isEditingText = true;

    // Focus and select text
    input.focus();
    input.select();

    // Handle input events
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.finishTextInput(x, y);
      } else if (e.key === "Escape") {
        this.cancelTextInput();
      }
      e.stopPropagation(); // Prevent canvas shortcuts
    });

    input.addEventListener("blur", () => {
      // Small delay to allow for other events to process
      setTimeout(() => {
        if (this.textInput && this.textInput.value.trim()) {
          this.finishTextInput(x, y);
        } else {
          this.cancelTextInput();
        }
      }, 100);
    });

    // Notify parent component if callback provided
    if (this.onTextInputCreate) {
      this.onTextInputCreate(input);
    }
  }

  finishTextInput(x: number, y: number) {
    if (!this.textInput || !this.textInput.value.trim()) {
      this.cancelTextInput();
      return;
    }

    const text = this.textInput.value.trim();
    const transform = this.transformRef.current;

    // Create text shape
    const newShape: Shapes = {
      type: "text",
      x: x,
      y: y,
      text: text,
      fontSize: 16 / transform.scale, // Adjust font size based on zoom
      color: "#ffffff",
    };
 
    this.existingShapes.push(newShape);

    // Send to server
    this.socket.send(
      JSON.stringify({
        type: "chat",
        shape: newShape,
        roomId: this.roomId,
      })
    );

    this.removeTextInput();
    this.redrawCanvas();
  }

  cancelTextInput() {
    this.removeTextInput();
  }

  removeTextInput() {
    if (this.textInput) {
      this.textInput.remove();
      this.textInput = null;
      this.isEditingText = false;
    }
  }

  redrawCanvas() {
    if (!this.ctx) return;

    const transform = this.transformRef.current;

    // Clear the entire canvas
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill background
    this.ctx.fillStyle = "rgba(30, 30, 30, 1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply transformations
    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.scale, transform.scale);

    // Draw all existing shapes
    this.existingShapes.forEach((shape, index) => {
      const isHovered = this.currentTool === "eraser" && index === this.hoveredShapeIndex;
      this.drawShape(shape, isHovered);
    });

    this.ctx.restore();
  }

  drawShape(shape: Shapes, isHovered: boolean = false) {
    if (!this.ctx) return;

    const transform = this.transformRef.current;

    this.ctx.save();

    // Apply hover effect for eraser
    const strokeStyle = isHovered ? "rgba(255, 100, 100, 0.8)" : "rgba(255, 255, 255, 0.8)";
    const fillStyle = isHovered ? "rgba(255, 100, 100, 0.3)" : "transparent";

    if (shape.type === "rect") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.fillStyle = fillStyle;
      this.ctx.lineWidth = 2 / transform.scale;
      
      if (isHovered) {
        this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.fillStyle = fillStyle;
      this.ctx.lineWidth = 2 / transform.scale;
      this.ctx.beginPath();
      this.ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
      
      if (isHovered) {
        this.ctx.fill();
      }
      this.ctx.stroke();
    } else if (shape.type === "text") {
      this.ctx.fillStyle = isHovered ? "rgba(255, 100, 100, 0.8)" : (shape.color || "#ffffff");
      this.ctx.font = `${shape.fontSize}px Arial`;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      
      if (isHovered) {
        // Add background highlight for text
        const textMetrics = this.ctx.measureText(shape.text);
        const textHeight = shape.fontSize;
        this.ctx.save();
        this.ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
        this.ctx.fillRect(shape.x - 2, shape.y - 2, textMetrics.width + 4, textHeight + 4);
        this.ctx.restore();
        this.ctx.fillStyle = "rgba(255, 100, 100, 0.8)";
      }
      
      this.ctx.fillText(shape.text, shape.x, shape.y);
    } else if (shape.type === "line") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = isHovered ? 4 / transform.scale : 2 / transform.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(shape.points[0], shape.points[1]);
      this.ctx.lineTo(shape.points[2], shape.points[3]);
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

  doubleClickHandler = (e: MouseEvent) => {
    if (e.button !== 0 || this.isEditingText) return;

    const coords = this.getCanvasCoordinates(e);
    this.createTextInput(coords.x, coords.y);
    e.preventDefault();
  };

  mouseDownHandler = (e: MouseEvent) => {
    // Cancel text input if clicking elsewhere
    if (this.isEditingText && this.textInput) {
      if (this.textInput.value.trim()) {
        this.finishTextInput(this.clickPosition.x, this.clickPosition.y);
      } else {
        this.cancelTextInput();
      }
    }

    // Handle eraser tool
    if (this.currentTool === "eraser") {
      const coords = this.getCanvasCoordinates(e);
      const shapeIndex = this.findShapeAtPoint(coords.x, coords.y);
      
      if (shapeIndex !== -1) {
        const shapeToDelete = this.existingShapes[shapeIndex];
        this.existingShapes.splice(shapeIndex, 1);
        console.log("Deleted shape:", shapeToDelete);
        
        // Send delete message to server
        this.socket.send(
          JSON.stringify({
            type: "deleteShape",
            shapeId: (shapeToDelete as any).id, // Assuming shapes have IDs from database
            roomId: this.roomId,
          })
        );
        
        this.redrawCanvas();
      }
      return;
    }

    // Only handle left mouse button and not when panning
    if (e.button !== 0 || e.shiftKey) return;

    // Track click timing and position for double-click detection
    const now = Date.now();
    const coords = this.getCanvasCoordinates(e);

    if (
      now - this.lastClickTime < 500 &&
      Math.abs(coords.x - this.clickPosition.x) < 10 &&
      Math.abs(coords.y - this.clickPosition.y) < 10
    ) {
      // This is handled by doubleClickHandler
      return;
    }

    this.lastClickTime = now;
    this.clickPosition = coords;

    this.clicked = true;
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
      } else if (this.currentTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        newShape = {
          type: "circle" as const,
          x: this.startX + width / 2,
          y: this.startY + height / 2,
          radius: radius,
        };
      } else if (this.currentTool === "line") {
        newShape = {
          type: "line" as const,
          x: this.startX, // Use start point as reference
          y: this.startY,
          points: [this.startX, this.startY, coords.x, coords.y],
        };
      } else {
        // Default to rect if unknown tool
        newShape = {
          type: "rect" as const,
          x: Math.min(this.startX, coords.x),
          y: Math.min(this.startY, coords.y),
          width: Math.abs(width),
          height: Math.abs(height),
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
    const coords = this.getCanvasCoordinates(e);

    // Handle eraser hover effect
    if (this.currentTool === "eraser") {
      const newHoveredIndex = this.findShapeAtPoint(coords.x, coords.y);
      if (newHoveredIndex !== this.hoveredShapeIndex) {
        this.hoveredShapeIndex = newHoveredIndex;
        this.redrawCanvas();
      }
      // Change cursor to indicate eraser mode
      this.canvas.style.cursor = newHoveredIndex !== -1 ? "pointer" : "crosshair";
      return;
    } else {
      // Reset cursor for other tools
      this.canvas.style.cursor = "crosshair";
      this.hoveredShapeIndex = -1;
    }

    if (!this.clicked || !this.ctx) return;

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
      this.ctx.arc(
        this.startX + width / 2,
        this.startY + height / 2,
        radius,
        0,
        2 * Math.PI
      );
      this.ctx.stroke();
    } else if (this.currentTool === "line") {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(coords.x, coords.y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  };

  preventContextMenu = (e: Event) => {
    e.preventDefault();
  };

  setTool(tool: string) {
    this.currentTool = tool;
    // Cancel any active text input when switching tools
    if (this.isEditingText) {
      this.cancelTextInput();
    }
  }

  onTransformChange() {
    // Update text input position if active
    if (this.textInput && this.isEditingText) {
      const transform = this.transformRef.current;
      const screenX = this.clickPosition.x * transform.scale + transform.x;
      const screenY = this.clickPosition.y * transform.scale + transform.y;

      this.textInput.style.left = `${screenX}px`;
      this.textInput.style.top = `${screenY}px`;
      this.textInput.style.fontSize = `${16 * transform.scale}px`;
    }
    this.redrawCanvas();
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("dblclick", this.doubleClickHandler);
    this.canvas.addEventListener("contextmenu", this.preventContextMenu);
  }

  // Helper function to find shape at a given point
  findShapeAtPoint(x: number, y: number): number {
    // Check shapes in reverse order (top to bottom)
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      
      if (shape.type === "rect") {
        if (x >= shape.x && x <= shape.x + shape.width &&
            y >= shape.y && y <= shape.y + shape.height) {
          return i;
        }
      } else if (shape.type === "circle") {
        const dx = x - shape.x;
        const dy = y - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= shape.radius) {
          return i;
        }
      } else if (shape.type === "text") {
        // Approximate text bounds (this could be improved with actual text measurement)
        const textWidth = shape.text.length * (shape.fontSize * 0.6);
        const textHeight = shape.fontSize;
        if (x >= shape.x && x <= shape.x + textWidth &&
            y >= shape.y && y <= shape.y + textHeight) {
          return i;
        }
      } else if (shape.type === "line") {
        // Check if point is near the line (within a tolerance)
        const tolerance = 5;
        const [x1, y1, x2, y2] = shape.points;
        const distance = this.distanceFromPointToLine(x, y, x1, y1, x2, y2);
        if (distance <= tolerance) {
          return i;
        }
      }
    }
    return -1;
  }

  // Helper function to calculate distance from point to line
  distanceFromPointToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (lineLength === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength ** 2)));
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    
    return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
  }
}
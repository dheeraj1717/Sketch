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
      points: [number, number, number, number];
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
    } else if (shape.type === "text") {
      this.ctx.fillStyle = shape.color || "#ffffff";
      this.ctx.font = `${shape.fontSize}px Arial`;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.fillText(shape.text, shape.x, shape.y);
    } else if (shape.type === "line") {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.lineWidth = 2 / transform.scale;
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
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
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
}

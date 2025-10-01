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
  private hoveredShapeIndex: number = -1;
  private selectedShapeIndex: number = -1;
  private isDraggingShape: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

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
    this.removeTextInput();

    const transform = this.transformRef.current;
    const screenX = x * transform.scale + transform.x;
    const screenY = y * transform.scale + transform.y;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type text...";

    input.style.position = "absolute";
    input.style.left = `${screenX}px`;
    input.style.top = `${screenY}px`;
    input.style.fontSize = `${16 * transform.scale}px`;
    input.style.fontFamily = "Virgil, Segoe UI Emoji, serif";
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

    document.body.appendChild(input);
    this.textInput = input;
    this.isEditingText = true;

    input.focus();
    input.select();

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.finishTextInput(x, y);
      } else if (e.key === "Escape") {
        this.cancelTextInput();
      }
      e.stopPropagation();
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (this.textInput && this.textInput.value.trim()) {
          this.finishTextInput(x, y);
        } else {
          this.cancelTextInput();
        }
      }, 100);
    });

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

    const newShape: Shapes = {
      type: "text",
      x: x,
      y: y,
      text: text,
      fontSize: 16 / transform.scale,
      color: "#ffffff",
    };

    this.existingShapes.push(newShape);

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

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "rgba(30, 30, 30, 1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.scale, transform.scale);

    this.existingShapes.forEach((shape, index) => {
      const isHovered =
        this.currentTool === "eraser" && index === this.hoveredShapeIndex;
      const isSelected =
        this.currentTool === "move" && index === this.selectedShapeIndex;
      this.drawShape(shape, isHovered, isSelected);
    });

    this.ctx.restore();
  }

  drawShape(
    shape: Shapes,
    isHovered: boolean = false,
    isSelected: boolean = false
  ) {
    if (!this.ctx) return;

    const transform = this.transformRef.current;

    this.ctx.save();

    const strokeStyle = isHovered
      ? "rgba(255, 100, 100, 0.8)"
      : isSelected
        ? "rgba(66, 133, 244, 0.9)"
        : "rgba(255, 255, 255, 0.8)";
    const fillStyle = isHovered ? "rgba(255, 100, 100, 0.3)" : "transparent";
    const lineWidth = isSelected ? 3 / transform.scale : 2 / transform.scale;

    if (shape.type === "rect") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.fillStyle = fillStyle;
      this.ctx.lineWidth = lineWidth;

      if (isHovered) {
        this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);

      if (isSelected) {
        this.drawSelectionBox(shape.x, shape.y, shape.width, shape.height);
      }
    } else if (shape.type === "circle") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.fillStyle = fillStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);

      if (isHovered) {
        this.ctx.fill();
      }
      this.ctx.stroke();

      if (isSelected) {
        const boxSize = shape.radius * 2;
        this.drawSelectionBox(
          shape.x - shape.radius,
          shape.y - shape.radius,
          boxSize,
          boxSize
        );
      }
    } else if (shape.type === "text") {
      this.ctx.fillStyle = isHovered
        ? "rgba(255, 100, 100, 0.8)"
        : shape.color || "#ffffff";
      this.ctx.font = `${shape.fontSize}px Arial`;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";

      const textMetrics = this.ctx.measureText(shape.text);
      const textHeight = shape.fontSize;

      if (isHovered || isSelected) {
        this.ctx.save();
        this.ctx.fillStyle = isSelected
          ? "rgba(66, 133, 244, 0.2)"
          : "rgba(255, 100, 100, 0.3)";
        this.ctx.fillRect(
          shape.x - 2,
          shape.y - 2,
          textMetrics.width + 4,
          textHeight + 4
        );
        this.ctx.restore();

        if (isHovered) {
          this.ctx.fillStyle = "rgba(255, 100, 100, 0.8)";
        }
      }

      this.ctx.fillText(shape.text, shape.x, shape.y);

      if (isSelected) {
        this.drawSelectionBox(
          shape.x - 2,
          shape.y - 2,
          textMetrics.width + 4,
          textHeight + 4
        );
      }
    } else if (shape.type === "line") {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = isHovered ? 4 / transform.scale : lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(shape.points[0], shape.points[1]);
      this.ctx.lineTo(shape.points[2], shape.points[3]);
      this.ctx.stroke();

      if (isSelected) {
        const minX = Math.min(shape.points[0], shape.points[2]);
        const minY = Math.min(shape.points[1], shape.points[3]);
        const maxX = Math.max(shape.points[0], shape.points[2]);
        const maxY = Math.max(shape.points[1], shape.points[3]);
        this.drawSelectionBox(minX, minY, maxX - minX, maxY - minY);
      }
    }

    this.ctx.restore();
  }

  drawSelectionBox(x: number, y: number, width: number, height: number) {
    if (!this.ctx) return;

    const transform = this.transformRef.current;
    const padding = 5 / transform.scale;

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(66, 133, 244, 0.9)";
    this.ctx.lineWidth = 2 / transform.scale;
    this.ctx.setLineDash([5 / transform.scale, 5 / transform.scale]);
    this.ctx.strokeRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2
    );

    // Draw corner handles
    const handleSize = 8 / transform.scale;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "rgba(66, 133, 244, 0.9)";
    this.ctx.setLineDash([]);

    const corners = [
      [x - padding, y - padding],
      [x + width + padding, y - padding],
      [x - padding, y + height + padding],
      [x + width + padding, y + height + padding],
    ];

    corners.forEach(([cx, cy]) => {
      this.ctx.fillRect(
        cx - handleSize / 2,
        cy - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        cx - handleSize / 2,
        cy - handleSize / 2,
        handleSize,
        handleSize
      );
    });

    this.ctx.restore();
  }

  moveShape(shape: Shapes, deltaX: number, deltaY: number) {
    if (shape.type === "rect" || shape.type === "text") {
      shape.x += deltaX;
      shape.y += deltaY;
    } else if (shape.type === "circle") {
      shape.x += deltaX;
      shape.y += deltaY;
    } else if (shape.type === "line") {
      shape.points[0] += deltaX;
      shape.points[1] += deltaY;
      shape.points[2] += deltaX;
      shape.points[3] += deltaY;
      shape.x += deltaX;
      shape.y += deltaY;
    }
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
    if (this.isEditingText && this.textInput) {
      if (this.textInput.value.trim()) {
        this.finishTextInput(this.clickPosition.x, this.clickPosition.y);
      } else {
        this.cancelTextInput();
      }
    }

    const coords = this.getCanvasCoordinates(e);

    // Handle eraser tool
    if (this.currentTool === "eraser") {
      const shapeIndex = this.findShapeAtPoint(coords.x, coords.y);

      if (shapeIndex !== -1) {
        const shapeToDelete = this.existingShapes[shapeIndex];
        this.existingShapes.splice(shapeIndex, 1);

        this.socket.send(
          JSON.stringify({
            type: "deleteShape",
            shapeId: (shapeToDelete as any).id,
            roomId: this.roomId,
          })
        );

        this.redrawCanvas();
      }
      return;
    }

    // Handle move tool
    if (this.currentTool === "move") {
      const shapeIndex = this.findShapeAtPoint(coords.x, coords.y);

      if (shapeIndex !== -1) {
        this.selectedShapeIndex = shapeIndex;
        this.isDraggingShape = true;

        const shape = this.existingShapes[shapeIndex];

        // Calculate offset from shape position to click position
        if (shape.type === "rect" || shape.type === "text") {
          this.dragOffset = {
            x: coords.x - shape.x,
            y: coords.y - shape.y,
          };
        } else if (shape.type === "circle") {
          this.dragOffset = {
            x: coords.x - shape.x,
            y: coords.y - shape.y,
          };
        } else if (shape.type === "line") {
          this.dragOffset = {
            x: coords.x - shape.x,
            y: coords.y - shape.y,
          };
        }

        this.canvas.style.cursor = "move";
        this.redrawCanvas();
      } else {
        this.selectedShapeIndex = -1;
        this.redrawCanvas();
      }
      return;
    }

    // Only handle left mouse button and not when panning
    if (e.button !== 0 || e.shiftKey) return;

    const now = Date.now();

    if (
      now - this.lastClickTime < 500 &&
      Math.abs(coords.x - this.clickPosition.x) < 10 &&
      Math.abs(coords.y - this.clickPosition.y) < 10
    ) {
      return;
    }

    this.lastClickTime = now;
    this.clickPosition = coords;

    this.clicked = true;
    this.startX = coords.x;
    this.startY = coords.y;
  };

  mouseUpHandler = (e: MouseEvent) => {
    // Handle move tool release
    if (
      this.currentTool === "move" &&
      this.isDraggingShape &&
      this.selectedShapeIndex !== -1
    ) {
      const movedShape = this.existingShapes[this.selectedShapeIndex];

      // Send update to server
      this.socket.send(
        JSON.stringify({
          type: "shapeUpdate",
          shape: movedShape,
          roomId: this.roomId,
        })
      );

      this.isDraggingShape = false;
      this.canvas.style.cursor = "default";
      return;
    }

    if (!this.clicked || e.button !== 0) return;
    this.clicked = false;

    const coords = this.getCanvasCoordinates(e);
    const width = coords.x - this.startX;
    const height = coords.y - this.startY;

    const transform = this.transformRef.current;

    if (
      Math.abs(width) > 5 / transform.scale ||
      Math.abs(height) > 5 / transform.scale
    ) {
      let newShape: Shapes | null = null;

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
          x: this.startX,
          y: this.startY,
          points: [this.startX, this.startY, coords.x, coords.y],
        };
      }

      if (newShape) {
        this.existingShapes.push(newShape);

        this.socket.send(
          JSON.stringify({
            type: "chat",
            shape: newShape,
            roomId: this.roomId,
          })
        );
      }
    }
    this.redrawCanvas();
  };

  mouseMoveHandler = (e: MouseEvent) => {
    const coords = this.getCanvasCoordinates(e);

    // Handle move tool dragging
    if (
      this.currentTool === "move" &&
      this.isDraggingShape &&
      this.selectedShapeIndex !== -1
    ) {
      const shape = this.existingShapes[this.selectedShapeIndex];

      // Calculate new position accounting for drag offset
      const newX = coords.x - this.dragOffset.x;
      const newY = coords.y - this.dragOffset.y;

      // Calculate delta from current position
      let deltaX = 0;
      let deltaY = 0;

      if (shape.type === "rect" || shape.type === "text") {
        deltaX = newX - shape.x;
        deltaY = newY - shape.y;
      } else if (shape.type === "circle") {
        deltaX = newX - shape.x;
        deltaY = newY - shape.y;
      } else if (shape.type === "line") {
        deltaX = newX - shape.x;
        deltaY = newY - shape.y;
      }

      this.moveShape(shape, deltaX, deltaY);
      this.redrawCanvas();
      return;
    }

    // Handle eraser hover effect
    if (this.currentTool === "eraser") {
      const newHoveredIndex = this.findShapeAtPoint(coords.x, coords.y);
      if (newHoveredIndex !== this.hoveredShapeIndex) {
        this.hoveredShapeIndex = newHoveredIndex;
        this.redrawCanvas();
      }
      this.canvas.style.cursor =
        newHoveredIndex !== -1 ? "pointer" : "default";
      return;
    }

    // Handle move tool hover effect
    if (this.currentTool === "move") {
      const newHoveredIndex = this.findShapeAtPoint(coords.x, coords.y);
      this.canvas.style.cursor = newHoveredIndex !== -1 ? "move" : "defaut";
    } else {
      this.canvas.style.cursor = "crosshair";
      this.hoveredShapeIndex = -1;
    }

    if (!this.clicked || !this.ctx) return;

    const width = coords.x - this.startX;
    const height = coords.y - this.startY;

    const transform = this.transformRef.current;

    this.redrawCanvas();

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
    if (this.isEditingText) {
      this.cancelTextInput();
    }
    // Reset selection when switching tools
    this.selectedShapeIndex = -1;
    this.isDraggingShape = false;
    this.redrawCanvas();
  }

  onTransformChange() {
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

  findShapeAtPoint(x: number, y: number): number {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];

      if (shape.type === "rect") {
        if (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        ) {
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
        const textWidth = shape.text.length * (shape.fontSize * 0.6);
        const textHeight = shape.fontSize;
        if (
          x >= shape.x &&
          x <= shape.x + textWidth &&
          y >= shape.y &&
          y <= shape.y + textHeight
        ) {
          return i;
        }
      } else if (shape.type === "line") {
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

  distanceFromPointToLine(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (lineLength === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    const t = Math.max(
      0,
      Math.min(
        1,
        ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength ** 2
      )
    );
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);

    return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
  }
}

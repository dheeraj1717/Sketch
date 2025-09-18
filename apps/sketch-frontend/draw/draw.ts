import { getExistingShapes } from "@/utils/fetchShapes";
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

export class draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private existingShapes: Shapes[] = [];
  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.socket = socket;
    this.roomId = roomId;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }
 async init() {
    const shapes = await getExistingShapes(this.roomId);
    this.existingShapes = shapes;
    // call redraw| clear canvas function

}
  initHandlers(){
     this.socket.onmessage = (event) =>{
        const message = JSON.parse(event.data);
        if(message.type === "chat"){
            const parsedShapes = message.shape;
            this.existingShapes.push(parsedShapes);
        }
    }
  } 
  mouseDownHandler(){
    this.clicked = true;
    const co
  }
  initMouseHandlers(){
    this.canvas.addEventListener("mouseDown", this.mouseDownHandler)
  }

}

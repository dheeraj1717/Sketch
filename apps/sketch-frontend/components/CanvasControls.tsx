import { Minus, Plus, MousePointer2, Move, Type, Command, Search, RefreshCw, Maximize, Lock, LockOpen } from "lucide-react";

interface CanvasControlsProps {
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  selectedTool: string;
}

export function CanvasControls({ transform, selectedTool }: CanvasControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      {/* Main Info Card */}
      <div className="bg-white/90 backdrop-blur-md shadow-xl border border-white/20 p-4 rounded-xl text-slate-800 w-64 transition-all hover:bg-white">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Canvas State</span>
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-mono">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Live
          </div>
        </div>

        <div className="space-y-3">
          {/* Zoom Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="w-4 h-4 text-purple-600" />
              Zoom
            </div>
            <div className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-sm">
                {(transform.scale * 100).toFixed(0)}%
            </div>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm font-medium">
              <Move className="w-4 h-4 text-blue-600" />
              Position
            </div>
             <div className="font-mono text-xs text-slate-500">
                {transform.x.toFixed(0)}, {transform.y.toFixed(0)}
            </div>
          </div>

           {/* Active Tool */}
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm font-medium">
              <MousePointer2 className="w-4 h-4 text-orange-600" />
              Tool
            </div>
             <div className="capitalize bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-sm font-medium">
                {selectedTool || "None"}
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Card */}
      <div className="bg-slate-900/90 backdrop-blur-md shadow-xl border border-white/10 p-4 rounded-xl text-slate-300 w-64">
           <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Shortcuts</div>
           <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between group hover:text-white transition-colors">
                  <span>Pan</span>
                  <div className="flex gap-1">
                      <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Space</kbd>
                      <span>+</span>
                      <span className="italic">Drag</span>
                  </div>
              </div>
              <div className="flex items-center justify-between group hover:text-white transition-colors">
                  <span>Zoom</span>
                  <div className="flex gap-1">
                      <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-sans">⌘</kbd>
                      <span>+</span>
                      <span className="italic">Scroll</span>
                  </div>
              </div>
              <div className="flex items-center justify-between group hover:text-white transition-colors">
                  <span>Reset View</span>
                   <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 min-w-[20px] text-center">R</kbd>
              </div>
               <div className="flex items-center justify-between group hover:text-white transition-colors">
                  <span>Center</span>
                   <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 min-w-[20px] text-center">F</kbd>
              </div>
           </div>
      </div>
    </div>
  );
}

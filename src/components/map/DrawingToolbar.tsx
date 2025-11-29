import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MousePointer2, 
  Pencil,
  Pentagon, 
  MoveRight, 
  Type, 
  Highlighter, 
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  CircleDot,
  Target,
  Download
} from "lucide-react";
import { DrawingTool } from "@/types/drawing";
import { ColorPicker } from "./ColorPicker";
import { BrushSizeControl } from "./BrushSizeControl";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  activeColor: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onScreenshot: () => void;
}

export const DrawingToolbar = ({
  activeTool,
  activeColor,
  brushSize,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onScreenshot,
}: DrawingToolbarProps) => {

  const tools = [
    { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select' },
    { id: 'freehand' as DrawingTool, icon: Pencil, label: 'Marker' },
    { id: 'polygon' as DrawingTool, icon: Pentagon, label: 'Polygon' },
    { id: 'arrow' as DrawingTool, icon: MoveRight, label: 'Arrow' },
    { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
    { id: 'highlighter' as DrawingTool, icon: Highlighter, label: 'Highlight' },
    { id: 'circle' as DrawingTool, icon: CircleDot, label: 'Circle' },
    { id: 'laser' as DrawingTool, icon: Target, label: 'Laser' },
    { id: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1 items-center">
        {/* Drawing tools */}
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id)}
                className="h-10 w-10"
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-1 w-8" />

        {/* Color picker */}
        <ColorPicker color={activeColor} onChange={onColorChange} />

        {/* Brush size */}
        <BrushSizeControl size={brushSize} onChange={onBrushSizeChange} />

        <Separator className="my-1 w-8" />

        {/* History controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-10 w-10"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-10 w-10"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="my-1 w-8" />

        {/* Screenshot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onScreenshot}
              className="h-10 w-10"
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Export Screenshot</p>
          </TooltipContent>
        </Tooltip>

        {/* Clear all */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Clear All</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export type DrawingTool = 
  | 'select' 
  | 'freehand' 
  | 'polygon' 
  | 'arrow' 
  | 'text' 
  | 'highlighter' 
  | 'eraser'
  | 'circle'
  | 'laser';

export interface DrawingState {
  activeTool: DrawingTool;
  activeColor: string;
  brushSize: number;
  isDrawingMode: boolean;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

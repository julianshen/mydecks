'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer, Type, Heading, Image, Square, Minus, Grid3X3, ZoomIn, ZoomOut,
  Play, Download, Undo, Redo, ChevronLeft, ChevronRight, Trash2, Copy, Layers
} from 'lucide-react';
import type { EditorState } from '@/types';

interface Props {
  editorState: EditorState;
  onChangeMode: (mode: EditorState['mode']) => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPresent: () => void;
  onExport: () => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function Toolbar({
  editorState, onChangeMode, onToggleGrid, onToggleSnap, onZoomIn, onZoomOut,
  onPresent, onExport, onDeleteElement, onDuplicateElement, onBringForward, onSendBackward,
  canUndo, canRedo, onUndo, onRedo
}: Props) {
  const tools = [
    { mode: 'select' as const, icon: MousePointer, label: 'Select (V)' },
    { mode: 'text' as const, icon: Type, label: 'Text (T)' },
    { mode: 'heading' as const, icon: Heading, label: 'Heading (H)' },
    { mode: 'image' as const, icon: Image, label: 'Image (I)' },
    { mode: 'shape' as const, icon: Square, label: 'Shape (S)' },
    { mode: 'line' as const, icon: Minus, label: 'Line (L)' },
  ];

  return (
    <div className="h-14 bg-white border-b flex items-center px-3 gap-1" data-testid="editor-toolbar">
      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} data-testid="toolbar-home">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {tools.map(tool => (
        <Tooltip key={tool.mode}>
          <TooltipTrigger>
            <Button
              variant={editorState.mode === tool.mode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onChangeMode(tool.mode)}
              data-testid={`tool-${tool.mode}`}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Tooltip>
        <TooltipTrigger>
          <Button variant={editorState.showGrid ? 'secondary' : 'ghost'} size="sm" onClick={onToggleGrid} data-testid="tool-grid">
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Grid</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button variant={editorState.snapToGrid ? 'secondary' : 'ghost'} size="sm" onClick={onToggleSnap} data-testid="tool-snap">
            <Layers className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Snap to Grid</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomOut} data-testid="tool-zoom-out"><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs w-12 text-center" data-testid="zoom-level">{Math.round(editorState.zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={onZoomIn} data-testid="tool-zoom-in"><ZoomIn className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} data-testid="tool-undo"><Undo className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} data-testid="tool-redo"><Redo className="h-4 w-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="ghost" size="sm" onClick={onDuplicateElement} data-testid="tool-duplicate"><Copy className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onBringForward} data-testid="tool-forward"><ChevronLeft className="h-4 w-4 rotate-90" /></Button>
      <Button variant="ghost" size="sm" onClick={onSendBackward} data-testid="tool-backward"><ChevronRight className="h-4 w-4 rotate-90" /></Button>
      <Button variant="ghost" size="sm" onClick={onDeleteElement} className="text-red-500" data-testid="tool-delete"><Trash2 className="h-4 w-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="outline" size="sm" onClick={onExport} data-testid="tool-export"><Download className="h-4 w-4 mr-1" />Export</Button>
      <Button size="sm" onClick={onPresent} data-testid="tool-present"><Play className="h-4 w-4 mr-1" />Present</Button>
    </div>
  );
}

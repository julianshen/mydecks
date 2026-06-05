export interface Deck {
  id: string;
  title: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  deck_id: string;
  sort_order: number;
  layout: string;
  background_color: string;
  background_image?: string;
  elements?: SlideElement[];
  created_at: string;
  updated_at: string;
}

export interface SlideElement {
  id: string;
  slide_id: string;
  type: 'text' | 'heading' | 'image' | 'shape' | 'line' | 'chart' | 'table';
  content: ElementContent;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  style: ElementStyle;
  created_at: string;
  updated_at: string;
}

export interface ElementContent {
  text?: string;
  src?: string;
  alt?: string;
  shapeType?: 'rect' | 'circle' | 'triangle';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor?: string; borderColor?: string }[] };
  tableData?: string[][];
  url?: string;
}

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  padding?: number;
}

export interface EditorState {
  selectedSlideId: string | null;
  selectedElementId: string | null;
  zoom: number;
  mode: 'select' | 'text' | 'heading' | 'image' | 'shape' | 'line' | 'chart' | 'table';
  showGrid: boolean;
  snapToGrid: boolean;
}

export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;
export const GRID_SIZE = 20;

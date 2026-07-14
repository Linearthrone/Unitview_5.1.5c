export const ZOOM_STEP = 0.08;
export const MIN_ZOOM_FLOOR = 0.2;
export const MAX_ZOOM_CEILING = 2;

export function clampGridZoom(value: number): number {
  return Math.min(MAX_ZOOM_CEILING, Math.max(MIN_ZOOM_FLOOR, value));
}

export interface GridZoomControls {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  atFitZoom: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

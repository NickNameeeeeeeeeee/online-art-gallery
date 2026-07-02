import { useCallback, useEffect, useRef, useState } from "react";

interface ArtworkViewerProps {
  src: string;
  alt: string;
}

type Point = { x: number; y: number };
type PanGesture = {
  type: "pan";
  pointerId: number;
  startPoint: Point;
  startOffset: Point;
};
type PinchGesture = {
  type: "pinch";
  startDistance: number;
  startCenter: Point;
  startZoom: number;
  startOffset: Point;
};
type Gesture = PanGesture | PinchGesture | null;

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const distanceBetween = (first: Point, second: Point) =>
  Math.hypot(second.x - first.x, second.y - first.y);

const centerBetween = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

export const ArtworkViewer = ({ src, alt }: ArtworkViewerProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const commitZoom = useCallback((nextZoom: number) => {
    const normalized = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = normalized;
    setZoom(normalized);
    return normalized;
  }, []);

  const getPanLimits = useCallback((scale: number) => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) {
      return { x: 0, y: 0 };
    }

    const viewportRect = viewport.getBoundingClientRect();
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const viewportRatio = viewportRect.width / viewportRect.height;

    const fittedWidth = imageRatio > viewportRatio
      ? viewportRect.width
      : viewportRect.height * imageRatio;
    const fittedHeight = imageRatio > viewportRatio
      ? viewportRect.width / imageRatio
      : viewportRect.height;

    return {
      x: Math.max(0, (fittedWidth * scale - viewportRect.width) / 2),
      y: Math.max(0, (fittedHeight * scale - viewportRect.height) / 2),
    };
  }, []);

  const commitOffset = useCallback((nextOffset: Point, scale = zoomRef.current) => {
    const limits = getPanLimits(scale);
    const normalized = {
      x: clamp(nextOffset.x, -limits.x, limits.x),
      y: clamp(nextOffset.y, -limits.y, limits.y),
    };
    offsetRef.current = normalized;
    setOffset(normalized);
    return normalized;
  }, [getPanLimits]);

  const setZoomLevel = useCallback((nextZoom: number) => {
    const normalized = commitZoom(nextZoom);
    if (normalized === MIN_ZOOM) {
      commitOffset({ x: 0, y: 0 }, normalized);
    } else {
      commitOffset(offsetRef.current, normalized);
    }
  }, [commitOffset, commitZoom]);

  const resetView = useCallback(() => {
    commitZoom(MIN_ZOOM);
    commitOffset({ x: 0, y: 0 }, MIN_ZOOM);
  }, [commitOffset, commitZoom]);

  useEffect(() => {
    resetView();
  }, [resetView, src]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      setZoomLevel(zoomRef.current + direction * ZOOM_STEP);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [setZoomLevel]);

  useEffect(() => {
    const handleResize = () => commitOffset(offsetRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [commitOffset]);

  const beginPinch = () => {
    const points = Array.from(activePointers.current.values());
    if (points.length < 2) return;
    gestureRef.current = {
      type: "pinch",
      startDistance: Math.max(1, distanceBetween(points[0], points[1])),
      startCenter: centerBetween(points[0], points[1]),
      startZoom: zoomRef.current,
      startOffset: offsetRef.current,
    };
    setIsPanning(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size >= 2) {
      for (const pointerId of activePointers.current.keys()) {
        try {
          event.currentTarget.setPointerCapture(pointerId);
        } catch {
          // A browser may reject capture for a pointer it has already cancelled.
        }
      }
      beginPinch();
      return;
    }

    if (zoomRef.current > MIN_ZOOM) {
      event.currentTarget.setPointerCapture(event.pointerId);
      gestureRef.current = {
        type: "pan",
        pointerId: event.pointerId,
        startPoint: { x: event.clientX, y: event.clientY },
        startOffset: offsetRef.current,
      };
      setIsPanning(true);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.type === "pinch") {
      const points = Array.from(activePointers.current.values());
      if (points.length < 2) return;
      const currentDistance = Math.max(1, distanceBetween(points[0], points[1]));
      const currentCenter = centerBetween(points[0], points[1]);
      const nextZoom = commitZoom(gesture.startZoom * (currentDistance / gesture.startDistance));
      commitOffset({
        x: gesture.startOffset.x + currentCenter.x - gesture.startCenter.x,
        y: gesture.startOffset.y + currentCenter.y - gesture.startCenter.y,
      }, nextZoom);
      return;
    }

    if (gesture.pointerId === event.pointerId && zoomRef.current > MIN_ZOOM) {
      commitOffset({
        x: gesture.startOffset.x + event.clientX - gesture.startPoint.x,
        y: gesture.startOffset.y + event.clientY - gesture.startPoint.y,
      });
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(event.pointerId);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The pointer may already have been released by the browser.
    }

    const remaining = Array.from(activePointers.current.entries());
    if (remaining.length === 1 && zoomRef.current > MIN_ZOOM) {
      const [pointerId, point] = remaining[0];
      gestureRef.current = {
        type: "pan",
        pointerId,
        startPoint: point,
        startOffset: offsetRef.current,
      };
      setIsPanning(true);
    } else {
      gestureRef.current = null;
      setIsPanning(false);
    }
  };

  const toggleDoubleClickZoom = () => {
    if (zoomRef.current > MIN_ZOOM) resetView();
    else setZoomLevel(2);
  };

  return (
    <div className="detail-image-wrap">
      <img
        src={src}
        alt=""
        className="detail-image-sizer"
        aria-hidden="true"
        draggable={false}
      />
      <div
        ref={viewportRef}
        className={`detail-image-viewport${zoom > MIN_ZOOM ? " is-zoomed" : ""}${isPanning ? " is-panning" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={toggleDoubleClickZoom}
        aria-label={`Zoomable view of ${alt}`}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="detail-image"
          draggable={false}
          onLoad={() => commitOffset(offsetRef.current)}
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }}
        />
      </div>

      <div className="zoom-controls" aria-label="Artwork zoom controls">
        <button
          type="button"
          onClick={() => setZoomLevel(zoomRef.current - ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <output aria-live="polite" aria-label="Current zoom level">
          {Math.round(zoom * 100)}%
        </output>
        <button
          type="button"
          onClick={() => setZoomLevel(zoomRef.current + ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="zoom-reset"
          onClick={resetView}
          disabled={zoom === MIN_ZOOM && offset.x === 0 && offset.y === 0}
        >
          Reset
        </button>
      </div>
      <p className="zoom-hint">Scroll or pinch to zoom. Drag to move.</p>
    </div>
  );
};

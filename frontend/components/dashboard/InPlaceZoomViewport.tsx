"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Minus, Plus } from "lucide-react";

export const MAX_ZOOM_SCALE = 10;

/** Shared compare- zoom + pan stay aligned across two views */
export type CompareSyncControl = {
  scale: number;
  scrollLeft: number;
  scrollTop: number;
  onScrollChange: (scrollLeft: number, scrollTop: number) => void;
  onBumpScale: (delta: number, sourceElement: HTMLDivElement) => void;
  onWheelZoom: (
    deltaScale: number,
    sourceElement: HTMLDivElement,
    clientX: number,
    clientY: number
  ) => void;
  onReset: () => void;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
};


export const VISIT_RANGE_CLASS_NAME =
  "w-full h-2 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-teal-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-teal-600";

/** Zoom/pan in the same panel. Pass `compareSync` so two panels share zoom/pan. */
export function InPlaceZoomViewport({
  src,
  alt,
  imageKey,
  compareSync,
  lesions,
  onSelectLesion,
}: {
  src: string;
  alt: string;
  imageKey: string | number;
  compareSync?: CompareSyncControl;
  lesions?: any[];
  onSelectLesion?: (lesion: any, x: number, y: number) => void;
}) {
  const [internalScale, setInternalScale] = useState(1);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const applyingScrollRef = useRef(false);
  const scrollAnchorRef = useRef<{
    rx: number;
    ry: number;
    vx: number;
    vy: number;
  } | null>(null);

  const scale = compareSync?.scale ?? internalScale;
  const isSynced = Boolean(compareSync);

  const setScrollContainerEl = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    if (compareSync) compareSync.scrollContainerRef.current = el;
  };

  useEffect(() => {
    setFailed(false);
    if (!isSynced) {
      setInternalScale(1);
    }
  }, [imageKey, isSynced]);

  useLayoutEffect(() => {
    if (isSynced) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    el.scrollTop = 0;
  }, [imageKey, isSynced]);

  /*
  * gets information on scroll for each side
  */
  useLayoutEffect(() => {
    if (isSynced) return;
    const el = containerRef.current;
    const anchor = scrollAnchorRef.current;
    scrollAnchorRef.current = null;
    if (!el || !anchor) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    const sw = el.scrollWidth;
    const sh = el.scrollHeight;
    el.scrollLeft = anchor.rx * sw - anchor.vx;
    el.scrollTop = anchor.ry * sh - anchor.vy;

    const maxL = Math.max(0, sw - w);
    const maxT = Math.max(0, sh - h);
    el.scrollLeft = Math.min(maxL, Math.max(0, el.scrollLeft));
    el.scrollTop = Math.min(maxT, Math.max(0, el.scrollTop));
  }, [internalScale, isSynced]);

  /*
  * compares the left and right side images scroll
  */
  useLayoutEffect(() => {
    if (!compareSync) return;
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft: sl, scrollTop: st } = compareSync;
    if (el.scrollLeft === sl && el.scrollTop === st) return;
    applyingScrollRef.current = true;
    const maxL = Math.max(0, el.scrollWidth - el.clientWidth);
    const maxT = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollLeft = Math.min(maxL, Math.max(0, sl));
    el.scrollTop = Math.min(maxT, Math.max(0, st));
    queueMicrotask(() => {
      applyingScrollRef.current = false;
    });
  }, [compareSync?.scrollLeft, compareSync?.scrollTop, compareSync?.scale]);

  const anchorZoomViewportCenter = () => {
    const el = containerRef.current;
    if (!el) return;
    const sw = el.scrollWidth;
    const sh = el.scrollHeight;
    if (sw <= 0 || sh <= 0) return;
    const vx = el.clientWidth / 2;
    const vy = el.clientHeight / 2;
    scrollAnchorRef.current = {
      rx: (el.scrollLeft + vx) / sw,
      ry: (el.scrollTop + vy) / sh,
      vx,
      vy,
    };
  };

  const bumpScale = (delta: number) => {
    const el = containerRef.current;
    if (compareSync && el) {
      compareSync.onBumpScale(delta, el);
      return;
    }
    anchorZoomViewportCenter();
    setInternalScale((s) =>
      Math.min(MAX_ZOOM_SCALE, Math.max(1, s + delta))
    );
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || compareSync) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setInternalScale((s) => {
        const next = Math.min(MAX_ZOOM_SCALE, Math.max(1, s + delta));
        if (next === s) return s;
        const sw = el.scrollWidth;
        const sh = el.scrollHeight;
        const rect = el.getBoundingClientRect();
        if (sw > 0 && sh > 0) {
          const vx = e.clientX - rect.left;
          const vy = e.clientY - rect.top;
          scrollAnchorRef.current = {
            rx: (el.scrollLeft + vx) / sw,
            ry: (el.scrollTop + vy) / sh,
            vx,
            vy,
          };
        }
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [compareSync]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !compareSync) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      compareSync.onWheelZoom(delta, el, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [compareSync]);

  const onScroll = () => {
    if (!compareSync) return;
    const el = containerRef.current;
    if (!el || applyingScrollRef.current) return;
    compareSync.onScrollChange(el.scrollLeft, el.scrollTop);
  };

  const handleReset = () => {
    if (compareSync) {
      compareSync.onReset();
      return;
    }
    scrollAnchorRef.current = null;
    setInternalScale(1);
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo(0, 0);
    });
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
      <div className="flex items-center justify-end gap-1 px-2 py-1.5 bg-neutral-100/90 border-b border-neutral-200 text-xs text-neutral-700">
        <button
          type="button"
          className="p-1 rounded hover:bg-neutral-200 disabled:opacity-35 disabled:pointer-events-none"
          aria-label="Zoom out"
          disabled={scale <= 1}
          onClick={() => bumpScale(-0.25)}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="tabular-nums w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="p-1 rounded hover:bg-neutral-200"
          aria-label="Zoom in"
          onClick={() => bumpScale(0.25)}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="ml-1 px-2 py-0.5 rounded hover:bg-neutral-200 text-neutral-600"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      <div
        ref={setScrollContainerEl}
        className="aspect-[4/3] overflow-auto bg-neutral-50"
        tabIndex={0}
        onScroll={onScroll}
      >
        {!failed ? (
          <div
            className="relative block"
            style={{
              width: `${100 * scale}%`,
              height: `${100 * scale}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="absolute left-0 top-0 h-full w-full object-contain object-center select-none"
              draggable={false}
              onError={() => setFailed(true)}
            />
            {lesions && (
              <svg
                viewBox="0 0 1024 2048"
                className="absolute inset-0 w-full h-full"
              >
                {lesions.map((lesion: any, idx: number) => {
                  const coords = lesion.polygon_mask[0];

                  const points = coords
                    .reduce((acc: string[], val: number, i: number, arr: number[]) => {
                      if (i % 2 === 0) {
                        acc.push(`${val},${arr[i + 1]}`);
                      }
                      return acc;
                    }, [])
                    .join(" ");

                  return (
                    <polygon
                      key={idx}
                      points={points}
                      fill="rgba(255,0,0,0.25)"
                      stroke="red"
                      strokeWidth="1"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as SVGElement).getBoundingClientRect();
                        onSelectLesion?.(lesion, rect.left, rect.top);
                      }}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-neutral-400 text-xs p-6 text-center h-full min-h-[12rem]">
            <span>Couldn’t load image</span>
            <span className="text-[10px]">URL may have expired — refresh the page</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 px-2 py-1 border-t border-neutral-100 bg-white">
        {isSynced
          ? "Zoom & pan are linked on both sides · scroll to pan"
          : "Scroll to pan when zoomed."}
      </p>
    </div>
  );
}

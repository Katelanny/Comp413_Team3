"use client";

import React, { useState, useEffect, useLayoutEffect, useRef,  useCallback, useMemo, } from "react";
import Logo from "@/components/Logo";
import {
  Info,
  GitCompare,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  InPlaceZoomViewport,
  MAX_ZOOM_SCALE,
  VISIT_RANGE_CLASS_NAME,
  type CompareSyncControl,
} from "@/components/dashboard/InPlaceZoomViewport";

type PatientInfo = {
  firstName: string;
  lastName: string;
  email: string;
  hasAccessToDiagnosis: boolean;
};

type LesionInfo = {
  id: number;
  anatomicalSite: string;
  diagnosis: string | null;
  numberOfLesions: number;
  dateRecorded: string;
};

type ImageRow = {
  fileName: string;
  signedUrl: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}


function normalizeImages(raw: unknown[]): ImageRow[] {
  const out: ImageRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = item as Record<string, unknown>;
    const fileName = String(x.fileName ?? x.FileName ?? "").trim();
    const signedUrl = String(
      x.signedUrl ?? x.SignedUrl ?? x.url ?? x.Url ?? ""
    ).trim();
    if (!signedUrl) continue;
    out.push({ fileName: fileName || "Photo", signedUrl });
  }
  return out;
}

function SignedPhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 text-neutral-400 text-xs p-4 text-center">
        <span>Couldn’t load image</span>
        <span className="text-[10px]">URL may have expired — refresh the page</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export default function PatientDashboard() {
  const [viewMode, setViewMode] = useState<"compare" | "timeline">("compare");
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [lesions, setLesions] = useState<LesionInfo[]>([]);
  /** Compare: visit index for left / right panel (visit order = array order). */
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  /** Timeline tab only. */
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Linked zoom/pan for compare mode (both panels). */
  const leftCompareScrollRef = useRef<HTMLDivElement | null>(null);
  const rightCompareScrollRef = useRef<HTMLDivElement | null>(null);
  const compareZoomAnchorRef = useRef<{
    rx: number;
    ry: number;
    vx: number;
    vy: number;
  } | null>(null);
  const [compareScale, setCompareScale] = useState(1);
  const [compareScroll, setCompareScroll] = useState({ l: 0, t: 0 });

  const handleCompareScroll = useCallback((l: number, t: number) => {
    setCompareScroll({ l, t });
  }, []);

  const handleCompareBumpScale = useCallback(
    (delta: number, el: HTMLDivElement) => {
      const sw = el.scrollWidth;
      const sh = el.scrollHeight;
      if (sw <= 0 || sh <= 0) return;
      const vx = el.clientWidth / 2;
      const vy = el.clientHeight / 2;
      compareZoomAnchorRef.current = {
        rx: (el.scrollLeft + vx) / sw,
        ry: (el.scrollTop + vy) / sh,
        vx,
        vy,
      };
      setCompareScale((s) =>
        Math.min(MAX_ZOOM_SCALE, Math.max(1, s + delta))
      );
    },
    []
  );

  const handleCompareWheelZoom = useCallback(
    (
      deltaScale: number,
      el: HTMLDivElement,
      clientX: number,
      clientY: number
    ) => {
      const sw = el.scrollWidth;
      const sh = el.scrollHeight;
      const rect = el.getBoundingClientRect();
      if (sw <= 0 || sh <= 0) return;
      const vx = clientX - rect.left;
      const vy = clientY - rect.top;
      compareZoomAnchorRef.current = {
        rx: (el.scrollLeft + vx) / sw,
        ry: (el.scrollTop + vy) / sh,
        vx,
        vy,
      };
      setCompareScale((s) => {
        const next = Math.min(MAX_ZOOM_SCALE, Math.max(1, s + deltaScale));
        return next === s ? s : next;
      });
    },
    []
  );

  const handleCompareReset = useCallback(() => {
    compareZoomAnchorRef.current = null;
    setCompareScale(1);
    setCompareScroll({ l: 0, t: 0 });
    requestAnimationFrame(() => {
      leftCompareScrollRef.current?.scrollTo(0, 0);
      rightCompareScrollRef.current?.scrollTo(0, 0);
    });
  }, []);

  useLayoutEffect(() => {
    const a = compareZoomAnchorRef.current;
    compareZoomAnchorRef.current = null;
    if (!a) return;
    const apply = (el: HTMLDivElement | null) => {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const sw = el.scrollWidth;
      const sh = el.scrollHeight;
      const l = a.rx * sw - a.vx;
      const t = a.ry * sh - a.vy;
      const maxL = Math.max(0, sw - w);
      const maxT = Math.max(0, sh - h);
      el.scrollLeft = Math.min(maxL, Math.max(0, l));
      el.scrollTop = Math.min(maxT, Math.max(0, t));
    };
    apply(leftCompareScrollRef.current);
    apply(rightCompareScrollRef.current);
    const src = leftCompareScrollRef.current;
    if (src) setCompareScroll({ l: src.scrollLeft, t: src.scrollTop });
  }, [compareScale]);

  useEffect(() => {
    setCompareScale(1);
    setCompareScroll({ l: 0, t: 0 });
  }, [leftIdx, rightIdx]);

  const leftCompareSync = useMemo(
    (): CompareSyncControl => ({
      scale: compareScale,
      scrollLeft: compareScroll.l,
      scrollTop: compareScroll.t,
      onScrollChange: handleCompareScroll,
      onBumpScale: handleCompareBumpScale,
      onWheelZoom: handleCompareWheelZoom,
      onReset: handleCompareReset,
      scrollContainerRef: leftCompareScrollRef,
    }),
    [
      compareScale,
      compareScroll.l,
      compareScroll.t,
      handleCompareScroll,
      handleCompareBumpScale,
      handleCompareWheelZoom,
      handleCompareReset,
    ]
  );

  const rightCompareSync = useMemo(
    (): CompareSyncControl => ({
      scale: compareScale,
      scrollLeft: compareScroll.l,
      scrollTop: compareScroll.t,
      onScrollChange: handleCompareScroll,
      onBumpScale: handleCompareBumpScale,
      onWheelZoom: handleCompareWheelZoom,
      onReset: handleCompareReset,
      scrollContainerRef: rightCompareScrollRef,
    }),
    [
      compareScale,
      compareScroll.l,
      compareScroll.t,
      handleCompareScroll,
      handleCompareBumpScale,
      handleCompareWheelZoom,
      handleCompareReset,
    ]
  );

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not signed in.");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const res = await fetch("http://localhost:5023/api/patient/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) throw new Error("Session expired. Please log in again.");
        if (!res.ok) throw new Error("Could not load your dashboard.");

        const data = await res.json() as Record<string, unknown>;

        setPatient({
          firstName: String(data.firstName ?? ""),
          lastName: String(data.lastName ?? ""),
          email: String(data.email ?? ""),
          hasAccessToDiagnosis: Boolean(data.hasAccessToDiagnosis),
        });

        const rawImages = Array.isArray(data.images) ? data.images : [];
        const list = normalizeImages(rawImages);
        setImages(list);

        const rawLesions = Array.isArray(data.lesions) ? data.lesions : [];
        setLesions(rawLesions as LesionInfo[]);

        setPhotoIdx(0);
        if (list.length >= 2) {
          setLeftIdx(0);
          setRightIdx(1);
        } else {
          setLeftIdx(0);
          setRightIdx(0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const max = Math.max(0, images.length - 1);
    setPhotoIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
    setLeftIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
    setRightIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
  }, [images.length]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5023/api/account/logout", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          accept: "*/*",
        },
      });
    } catch {
      /* ignore */
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  const displayName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : "—";

  const currentPhoto = images[photoIdx];
  const leftImg = images[leftIdx];
  const rightImg = images[rightIdx];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Lesion Tracker</h1>
            <p className="text-sm text-neutral-500">My Health Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-neutral-600">
          <div className="text-right">
            <p className="font-medium text-neutral-900">
              {loading ? "Loading…" : displayName}
            </p>
            <p className="text-sm text-neutral-500">Patient Portal</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-teal-600 font-medium hover:text-teal-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Tracking Your Progress */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Info className="text-teal-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                Tracking Your Progress
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Body photos are taken at each visit so your doctor can track
                changes over time. Compare two visits side by side and use the
                visit sliders to pick which photo appears on each side.
              </p>
            </div>
          </div>
        </section>

        {/* Tracked regions, visit summary */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Your profile
          </h2>
          <p className="text-neutral-500 text-sm mb-4">
            Body photos are grouped by visit. Zoom in on a photo to view and
            compare lesions in that area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-neutral-500 mb-0.5">Email</p>
              <p className="font-medium text-neutral-900">
                {patient ? patient.email : loading ? "…" : "—"}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 mb-0.5">Tracked lesions</p>
              <p className="font-medium text-neutral-900">
                {loading ? "…" : `${lesions.length}`}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 mb-0.5">Photos linked</p>
              <p className="font-medium text-neutral-900">
                {loading ? "…" : `${images.length}`}
              </p>
            </div>
          </div>
          {patient && (
            <p className="text-sm text-neutral-600 mt-4">
              Diagnosis access:{" "}
              {patient.hasAccessToDiagnosis ? "Yes" : "No"}
            </p>
          )}
        </section>

        {/* Photos over time */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Photos over time
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {viewMode === "compare"
                  ? "Select two photos to compare."
                  : "Step through photos in order with the slider."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewMode === "compare"
                    ? "bg-teal-100 text-teal-600"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <GitCompare size={16} />
                Compare
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewMode === "timeline"
                    ? "bg-teal-100 text-teal-600"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <History size={16} />
                Timeline
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {images.length === 0 && !loading && (
              <p className="text-sm text-neutral-500">
                {"No photos are linked to your account yet. Your care team will add images after your visits."}
              </p>
            )}

            {viewMode === "compare" && images.length > 0 && leftImg && rightImg && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-3 min-w-0">
                  {leftImg.signedUrl ? (
                    <InPlaceZoomViewport
                      imageKey={`left-${leftIdx}-${leftImg.fileName}`}
                      src={leftImg.signedUrl}
                      alt={leftImg.fileName}
                      compareSync={leftCompareSync}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/90 px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-800">
                      <span>Left — visit</span>
                      <span className="tabular-nums text-neutral-600 shrink-0">
                        {leftIdx + 1} / {images.length}
                      </span>
                    </div>
                    <label htmlFor="compare-left-visit" className="sr-only">
                      Choose visit for left compare panel
                    </label>
                    <input
                      id="compare-left-visit"
                      type="range"
                      min={0}
                      max={Math.max(0, images.length - 1)}
                      step={1}
                      value={leftIdx}
                      onChange={(e) =>
                        setLeftIdx(Number.parseInt(e.target.value, 10))
                      }
                      className={VISIT_RANGE_CLASS_NAME}
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Earlier</span>
                      <span>Later</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-900 truncate pt-1 border-t border-neutral-200/70">
                      {leftImg.fileName}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 min-w-0">
                  {rightImg.signedUrl ? (
                    <InPlaceZoomViewport
                      imageKey={`right-${rightIdx}-${rightImg.fileName}`}
                      src={rightImg.signedUrl}
                      alt={rightImg.fileName}
                      compareSync={rightCompareSync}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/90 px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-800">
                      <span>Right — visit</span>
                      <span className="tabular-nums text-neutral-600 shrink-0">
                        {rightIdx + 1} / {images.length}
                      </span>
                    </div>
                    <label htmlFor="compare-right-visit" className="sr-only">
                      Choose visit for right compare panel
                    </label>
                    <input
                      id="compare-right-visit"
                      type="range"
                      min={0}
                      max={Math.max(0, images.length - 1)}
                      step={1}
                      value={rightIdx}
                      onChange={(e) =>
                        setRightIdx(Number.parseInt(e.target.value, 10))
                      }
                      className={VISIT_RANGE_CLASS_NAME}
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Earlier</span>
                      <span>Later</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-900 truncate pt-1 border-t border-neutral-200/70">
                      {rightImg.fileName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "timeline" && images.length > 0 && currentPhoto && (
              <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/90 overflow-hidden">
                <div className="px-3 pt-3 pb-2 border-b border-neutral-100 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Timeline
                  </h3>
                  <span className="text-xs tabular-nums text-neutral-500 shrink-0">
                    {photoIdx + 1} / {images.length}
                  </span>
                </div>

                <div className="px-2 sm:px-3 py-2">
                  <p className="text-[11px] text-neutral-500 mb-2 px-1">
                    Tap a thumbnail to jump, or use the side arrows.
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-0.5 px-0.5">
                    {images.map((img, i) => (
                      <button
                        key={`tl-thumb-${img.fileName}-${i}`}
                        type="button"
                        onClick={() => setPhotoIdx(i)}
                        className={`shrink-0 w-14 sm:w-16 rounded-lg border-2 overflow-hidden transition-all ${
                          photoIdx === i
                            ? "border-teal-500 shadow-sm ring-2 ring-teal-100/80 scale-[1.02]"
                            : "border-neutral-200/80 hover:border-neutral-300 opacity-90 hover:opacity-100"
                        }`}
                        aria-label={`Photo ${i + 1} of ${images.length}`}
                      >
                        <div className="aspect-square bg-neutral-100">
                          {img.signedUrl ? (
                            <SignedPhoto
                              src={img.signedUrl}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <span className="text-[10px] text-neutral-400 flex items-center justify-center h-full">
                              —
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-stretch gap-1 sm:gap-2 px-1 sm:px-2 pb-3">
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                    disabled={photoIdx <= 0}
                    className="shrink-0 self-center flex h-11 w-10 sm:w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-teal-200 disabled:opacity-35 disabled:pointer-events-none"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <div className="flex-1 min-w-0 flex justify-center">
                    <div className="w-full max-w-lg sm:max-w-xl">
                      <InPlaceZoomViewport
                        imageKey={`tl-${photoIdx}-${currentPhoto.fileName}`}
                        src={currentPhoto.signedUrl}
                        alt={currentPhoto.fileName}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPhotoIdx((i) =>
                        Math.min(images.length - 1, i + 1)
                      )
                    }
                    disabled={photoIdx >= images.length - 1}
                    className="shrink-0 self-center flex h-11 w-10 sm:w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-teal-200 disabled:opacity-35 disabled:pointer-events-none"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="px-3 py-2.5 border-t border-neutral-100 bg-white/80 flex items-center gap-2 min-h-[2.75rem]">
                  <p className="text-sm font-medium text-neutral-900 truncate min-w-0 flex-1">
                    {currentPhoto.fileName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="font-bold text-neutral-900 mb-2">Progress update</h3>
          <p className="text-neutral-700 text-sm leading-relaxed">
            Automated progress summaries will appear here when your care team
            records measurements and notes in the system.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Tracked Lesions
          </h2>
          {lesions.length === 0 && !loading ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <p className="text-neutral-600 text-sm">
                No lesion records yet. Your care team will add entries after each visit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lesions.map((l) => (
                <div key={l.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span><span className="text-neutral-500">Site:</span> <span className="font-medium">{l.anatomicalSite}</span></span>
                    <span><span className="text-neutral-500">Count:</span> <span className="font-medium">{l.numberOfLesions}</span></span>
                    {l.diagnosis && (
                      <span><span className="text-neutral-500">Diagnosis:</span> <span className="font-medium">{l.diagnosis}</span></span>
                    )}
                    <span><span className="text-neutral-500">Recorded:</span> <span className="font-medium">{formatDate(l.dateRecorded)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

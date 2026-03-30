"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Logo from "@/components/Logo";
import {
  Info,
  GitCompare,
  History,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PatientInfo = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  hasAccessToDiagnosis: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  lastLoginAtUtc: string;
};

type ImageRow = {
  fileName: string;
  signedUrl: string;
};

/** Read email + username */
function jwtEmailAndUsername(token: string): {
  email?: string;
  given_name?: string;
} {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { email?: string; given_name?: string };
  } catch {
    return {};
  }
}

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


function normalizeImagesFromApi(imgJson: unknown): ImageRow[] {
  if (!imgJson || typeof imgJson !== "object") return [];
  const o = imgJson as Record<string, unknown>;
  const raw = o.images;
  if (!Array.isArray(raw)) return [];
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

/** Zoom/pan in the same panel */
function InPlaceZoomViewport({
  src,
  alt,
  imageKey,
}: {
  src: string;
  alt: string;
  imageKey: string | number;
}) {
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  /** After scale changes, keep this content point under the viewport point (ratios 0–1). */
  const scrollAnchorRef = useRef<{
    rx: number;
    ry: number;
    vx: number;
    vy: number;
  } | null>(null);

  useEffect(() => {
    setScale(1);
    setFailed(false);
  }, [imageKey]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    el.scrollTop = 0;
  }, [imageKey]);

  useLayoutEffect(() => {
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
  }, [scale]);

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
    anchorZoomViewportCenter();
    setScale((s) => Math.min(4, Math.max(1, s + delta)));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setScale((s) => {
        const next = Math.min(4, Math.max(1, s + delta));
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
  }, []);

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
          onClick={() => {
            scrollAnchorRef.current = null;
            setScale(1);
            requestAnimationFrame(() => {
              containerRef.current?.scrollTo(0, 0);
            });
          }}
        >
          Reset
        </button>
      </div>
      <div
        ref={containerRef}
        className="aspect-[4/3] overflow-auto bg-neutral-50"
        tabIndex={0}
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-neutral-400 text-xs p-6 text-center h-full min-h-[12rem]">
            <span>Couldn’t load image</span>
            <span className="text-[10px]">URL may have expired — refresh the page</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 px-2 py-1 border-t border-neutral-100 bg-white">
        Scroll to pan when zoomed.
      </p>
    </div>
  );
}

export default function PatientDashboard() {
  const [viewMode, setViewMode] = useState<"compare" | "timeline">("compare");
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [timelineIdx, setTimelineIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesEmptyMessage, setImagesEmptyMessage] = useState<string | null>(
    null
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
    setImagesEmptyMessage(null);
    setLoading(true);

    try {
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      } as const;

      const [patientsRes, imgRes] = await Promise.all([
        fetch("http://localhost:5023/api/patient", {
          method: "GET",
          headers: authHeaders,
        }),
        fetch("http://localhost:5023/api/images", {
          method: "POST",
          headers: authHeaders,
          body: "{}",
        }),
      ]);

      if (!patientsRes.ok) throw new Error("Could not load patient list.");

      const patients: PatientInfo[] = await patientsRes.json();
      const { email, given_name } = jwtEmailAndUsername(token);
      const me = patients.find((p) => {
        const row = p.email?.toLowerCase() ?? "";
        return (
          (email && row === email.toLowerCase()) ||
          (given_name && row === given_name.toLowerCase())
        );
      });
      if (!me) {
        setPatient(null);
        setError(
          "No patient row matches your account email or username in the Patients table."
        );
      } else {
        setPatient(me);
      }

      if (!imgRes.ok) {
        if (imgRes.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error("Could not load your photos.");
      }

      const imgJson = (await imgRes.json()) as Record<string, unknown>;
      const list = normalizeImagesFromApi(imgJson);
      setImages(list);

      const apiMsg =
        typeof imgJson.message === "string" ? imgJson.message : null;
      setImagesEmptyMessage(list.length === 0 ? apiMsg : null);

      if (list.length >= 2) {
        setLeftIdx(0);
        setRightIdx(1);
      } else if (list.length === 1) {
        setLeftIdx(0);
        setRightIdx(0);
      } else {
        setLeftIdx(0);
        setRightIdx(0);
      }
      setTimelineIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
    };
    loadData();
  }, []);

  useEffect(() => {
    setTimelineIdx((i) => {
      if (images.length === 0) return 0;
      return Math.min(i, images.length - 1);
    });
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

  const leftImg = images[leftIdx];
  const rightImg = images[rightIdx];
  const timelineImg = images[timelineIdx];

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
                changes over time. You can zoom in on any area and compare two
                visits side by side to see how specific lesions are changing.
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
              <p className="text-neutral-500 mb-0.5">Regions</p>
              <p className="font-medium text-neutral-900">
                {patient ? "—" : loading ? "…" : "—"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Region labels are added by your care team when available.
              </p>
            </div>
            <div>
              <p className="text-neutral-500 mb-0.5">First visit (record)</p>
              <p className="font-medium text-neutral-900">
                {patient ? formatDate(patient.createdAtUtc) : loading ? "…" : "—"}
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
              DOB: {patient.dateOfBirth} · Diagnosis access:{" "}
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
                  : "Step through photos in order with the arrows."}
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
                {imagesEmptyMessage ??
                  "No photos are linked to your account yet. Your care team will add images after your visits."}
              </p>
            )}

            {viewMode === "compare" && images.length > 0 && (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {leftImg?.signedUrl ? (
                  <InPlaceZoomViewport
                    imageKey={`left-${leftIdx}`}
                    src={leftImg.signedUrl}
                    alt={leftImg.fileName}
                  />
                ) : (
                  <div className="aspect-[4/3] bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-1">
                    <span className="text-neutral-400 text-sm">Body photo</span>
                    <span className="text-neutral-400 text-xs">
                      No image selected
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900">
                    {leftImg?.fileName ?? "—"}
                  </p>
                  <p className="text-sm text-neutral-500">Linked photo</p>
                  <p className="text-sm text-neutral-700 mt-1">Size: —</p>
                  <p className="text-sm text-neutral-700">Area: —</p>
                </div>
              </div>
              <div className="space-y-3">
                {rightImg?.signedUrl ? (
                  <InPlaceZoomViewport
                    imageKey={`right-${rightIdx}`}
                    src={rightImg.signedUrl}
                    alt={rightImg.fileName}
                  />
                ) : (
                  <div className="aspect-[4/3] bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-1">
                    <span className="text-neutral-400 text-sm">Body photo</span>
                    <span className="text-neutral-400 text-xs">
                      No image selected
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900">
                    {rightImg?.fileName ?? "—"}
                  </p>
                  <p className="text-sm text-neutral-500">Linked photo</p>
                  <p className="text-sm text-neutral-700 mt-1">Size: —</p>
                  <p className="text-sm text-neutral-700">Area: —</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-3">
                    Select left photo
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button
                        key={img.fileName + i}
                        type="button"
                        onClick={() => setLeftIdx(i)}
                        className={`shrink-0 w-28 rounded-xl border-2 overflow-hidden transition-colors ${
                          leftIdx === i
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="aspect-square bg-neutral-100 relative">
                          {img.signedUrl ? (
                            <SignedPhoto
                              src={img.signedUrl}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <span className="text-neutral-400 text-xs flex items-center justify-center h-full">
                              Photo
                            </span>
                          )}
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium truncate">
                            {img.fileName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-3">
                    Select right photo
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button
                        key={`r-${img.fileName}-${i}`}
                        type="button"
                        onClick={() => setRightIdx(i)}
                        className={`shrink-0 w-28 rounded-xl border-2 overflow-hidden transition-colors ${
                          rightIdx === i
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="aspect-square bg-neutral-100 relative">
                          {img.signedUrl ? (
                            <SignedPhoto
                              src={img.signedUrl}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <span className="text-neutral-400 text-xs flex items-center justify-center h-full">
                              Photo
                            </span>
                          )}
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium truncate">
                            {img.fileName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </>
            )}

            {viewMode === "timeline" && images.length > 0 && timelineImg && (
              <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/90 overflow-hidden">
                <div className="px-3 pt-3 pb-2 border-b border-neutral-100 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Timeline
                  </h3>
                  <span className="text-xs tabular-nums text-neutral-500 shrink-0">
                    {timelineIdx + 1} / {images.length}
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
                        onClick={() => setTimelineIdx(i)}
                        className={`shrink-0 w-14 sm:w-16 rounded-lg border-2 overflow-hidden transition-all ${
                          timelineIdx === i
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
                    onClick={() => setTimelineIdx((i) => Math.max(0, i - 1))}
                    disabled={timelineIdx <= 0}
                    className="shrink-0 self-center flex h-11 w-10 sm:w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-teal-200 disabled:opacity-35 disabled:pointer-events-none"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <div className="flex-1 min-w-0 flex justify-center">
                    <div className="w-full max-w-lg sm:max-w-xl">
                      <InPlaceZoomViewport
                        imageKey={`tl-${timelineIdx}-${timelineImg.fileName}`}
                        src={timelineImg.signedUrl}
                        alt={timelineImg.fileName}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setTimelineIdx((i) =>
                        Math.min(images.length - 1, i + 1)
                      )
                    }
                    disabled={timelineIdx >= images.length - 1}
                    className="shrink-0 self-center flex h-11 w-10 sm:w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-teal-200 disabled:opacity-35 disabled:pointer-events-none"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="px-3 py-2.5 border-t border-neutral-100 bg-white/80 flex items-center gap-2 min-h-[2.75rem]">
                  <p className="text-sm font-medium text-neutral-900 truncate min-w-0 flex-1">
                    {timelineImg.fileName}
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
            What your doctor says
          </h2>
          <div className="space-y-4">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <p className="text-neutral-600 text-sm">
                Clinical notes and guidance from your provider will show here
                when they are added to your record.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

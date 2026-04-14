"use client";
import Link from "next/link";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Logo from "@/components/Logo";
import {
  Search,
  Minus,
  Plus,
  User,
} from "lucide-react";

const dummyLesionData = {
  predictions: [
    {
      img_id: "24",
      lesions: [
        {
          lesion_id: "string_0",
          score: 0.9981,
          anatomical_site: "Left Arm",
          prev_lesion_id: null,
          relative_size_change: "+5%",
          polygon_mask: [[496,623,495,624,494,624,489,629,489,630,488,631,488,635,489,636,489,637,490,638,491,638,493,640,504,640,505,639,505,638,506,637,506,628,505,627,505,626,503,624,502,624,501,623]]
        },
        {
          lesion_id: "string_1",
          score: 0.9970,
          anatomical_site: "Back",
          prev_lesion_id: "string_0",
          relative_size_change: "-2%",
          polygon_mask: [[586,796,585,797,584,797,583,798,583,799,582,800,582,801,581,802,581,811,582,812,582,813,584,815,594,815,595,814,595,813,596,812,596,802,595,801,595,799,592,796]]
        },
        {
          lesion_id: "string_2",
          score: 0.9964,
          anatomical_site: "Right Shoulder",
          prev_lesion_id: "string_1",
          relative_size_change: "+1%",
          polygon_mask: [[482,904,481,905,480,905,475,910,475,911,474,912,474,913,473,914,473,923,474,924,474,925,488,925,491,922,491,908,490,907,490,905,489,904]]
        },
        {
          lesion_id: "string_3",
          score: 0.9955,
          anatomical_site: "Lower Back",
          prev_lesion_id: null,
          relative_size_change: "0%",
          polygon_mask: [[382,1313,380,1315,380,1323,381,1324,381,1325,390,1325,391,1324,391,1317,388,1314,387,1314,386,1313]]
        },
        {
          lesion_id: "string_4",
          score: 0.9952,
          anatomical_site: "Left Leg",
          prev_lesion_id: "string_2",
          relative_size_change: "+3%",
          polygon_mask: [[321,527,320,528,319,528,317,530,317,531,316,532,316,542,317,543,317,545,318,546,318,547,322,551,330,551,331,550,331,536,329,534,329,533,325,529,324,529,323,528,322,528]]
        },
        {
          lesion_id: "string_5",
          score: 0.9924,
          anatomical_site: "Neck",
          prev_lesion_id: null,
          relative_size_change: "-1%",
          polygon_mask: [[818,544,816,546,816,552,817,553,825,553,826,552,826,551,827,550,826,549,826,547,824,545,823,545,822,544]]
        }
      ]
    }
  ]
};

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [doctor, setDoctor] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [lesions, setLesions] = useState<any[]>([]);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [selectedLesion, setSelectedLesion] = useState<any>(null);
  
  function findLesionForImage(img: any, lesions: any[]) {
    return lesions.find(
      (l) =>
        new Date(l.dateRecorded).toDateString() ===
        new Date(img.dateTaken).toDateString()
    );
  }
    const leftMetrics = findLesionForImage(images[leftIdx], lesions);
  const rightMetrics = findLesionForImage(images[rightIdx], lesions);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5023/api/doctor/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard");

        const data = await res.json();        
        setDoctor({
          firstName: data.firstName,
          lastName: data.lastName,
        });

        const formatted = (data.patients || []).map((p: any) => ({
          id: p.patientId,
          name: `${p.firstName ?? ""} ${p.lastName ?? ""}`,
          mrn: p.patientId,
          lastVisit: p.lastVisitDate
            ? p.lastVisitDate.split("T")[0]
            : "N/A",
          email: p.email,
        }));

        setPatients(formatted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [patients]);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatient) return;
      setImagesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [detailsRes, patientRes] = await Promise.all([
          fetch(
            `http://localhost:5023/api/doctor/patients/${selectedPatient.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(
            `http://localhost:5023/api/patient/${selectedPatient.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        if (!detailsRes.ok) throw new Error("Failed to fetch patient data");
        if (!patientRes.ok) throw new Error("Failed to fetch patient profile");
        const data = await detailsRes.json();
        const patientProfile = await patientRes.json();
        setPatientDetails(patientProfile); 

        const imgs = (data.images || [])
          .map((img: any) => ({
            fileName: img.fileName,
            signedUrl: img.url,
            dateTaken: img.dateTaken,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(a.dateTaken).getTime() -
              new Date(b.dateTaken).getTime()
          );

        setImages(imgs);
        setLesions(data.lesions || []);

        if (imgs.length >= 2) {
          setLeftIdx(imgs.length - 2);
          setRightIdx(imgs.length - 1);
        } else if (imgs.length === 1) {
          setLeftIdx(0);
          setRightIdx(0);
        } else {
          setLeftIdx(0);
          setRightIdx(0);
        }
      } catch (err) {
        console.error(err);
        setImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchPatientDetails();
  }, [selectedPatient]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toString().includes(searchQuery)
  );

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5023/api/account/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "*/*",
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  function InPlaceZoomViewport({ src, alt, imageKey,}: { src: string; alt: string; imageKey: string | number;}) {
    const [scale, setScale] = useState(1);
    const [failed, setFailed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
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
              <div className="relative w-full h-full">
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-full object-contain"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    console.log("Natural size:", img.naturalWidth, img.naturalHeight);
                  }}
                />
                {selectedLesion && (
                  <div className="absolute bg-white border rounded-lg shadow-lg p-3 text-xs z-10"
                      style={{ top: 20, left: 20 }}>
                    <p><strong>ID:</strong> {selectedLesion.lesion_id}</p>
                    <p><strong>Confidence:</strong> {(selectedLesion.score * 100).toFixed(2)}%</p>
                    <p><strong>Site:</strong> {selectedLesion.anatomical_site ?? "N/A"}</p>
                    <p><strong>Previous:</strong> {selectedLesion.prev_lesion_id ?? "None"}</p>
                    <p><strong>Change:</strong> {selectedLesion.relative_size_change ?? "N/A"}</p>
                  </div>
                )}

                <LesionOverlay
                  lesions={dummyLesionData.predictions[0].lesions}
                  imgWidth={1024}
                  imgHeight={2048}
                  onSelectLesion={setSelectedLesion}
                />
              </div>
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

    function LesionOverlay({
      lesions,
      imgWidth = 1024,
      imgHeight = 2048,
      onSelectLesion
    }: {
      lesions: any[];
      imgWidth?: number;
      imgHeight?: number;
      onSelectLesion?: (lesion: any, x: number, y: number) => void;
    }) {
      return (
        <svg
          viewBox={`0 0 ${imgWidth} ${imgHeight}`}
          className="absolute top-0 left-0 w-full h-full"
        >
          {lesions.map((lesion, idx) => {
            const coords = lesion.polygon_mask[0];
            const points = coords
              .reduce((acc: string[], val: number, i: number, arr: number[]) => {
                if (i % 2 === 0) {
                  acc.push(`${val},${arr[i + 1]}`);
                }
                return acc;
              }, [])
              .join(" ");

            const firstX = coords[0];
            const firstY = coords[1];
            return (
              <g key={idx}>
                <polygon
                  points={points}
                  fill="rgba(255,0,0,0.25)"
                  stroke="red"
                  strokeWidth="1"
                  className="cursor-pointer"
                  onClick={() => onSelectLesion?.(lesion, firstX, firstY)}
                />
              </g>
            );
          })}
        </svg>
      );
    }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-xl font-medium">Doctor Dashboard</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-600">
          <span className="font-medium">
            {doctor
              ? `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`
              : "Loading..."}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-teal-600 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Patient list */}
        <aside className="w-80 flex flex-col bg-white border-r border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {filteredPatients.map((patient) => (
              <li key={patient.id}>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl ${
                    selectedPatient?.id === patient.id
                      ? "bg-teal-600 text-white"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-200">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm">
                      MRN: {patient.mrn} · Last: {patient.lastVisit}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedPatient && (
            <>
              {/* Patient info bar */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">
                  {selectedPatient.name}
                </h1>
                <p className="text-neutral-500 text-sm mt-0.5">
                  DOB: {patientDetails?.dateOfBirth
                        ? new Date(patientDetails.dateOfBirth).toLocaleDateString()
                        : "N/A"} ||
                  Email: {patientDetails?.email ?? "N/A"} ||
                  Phone: {patientDetails?.phone ?? "N/A"} ||
                  Gender: {patientDetails?.gender ?? "N/A"}
                </p>
                <p>
                  Diagnosis Access:{" "}
                  {patientDetails?.hasAccessToDiagnosis ? "Yes" : "No"}
                </p>
              </div>

              {/* Comparison cards */}
              <p className="text-sm text-neutral-500 mb-4">
                Compare body photos from two visits. Use zoom to focus on a
                specific lesion; metrics below apply to the zoomed region.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left card */}
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {images[leftIdx]?.fileName ?? "No image"}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {images[leftIdx]?.dateTaken
                          ? new Date(images[leftIdx].dateTaken).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {images[leftIdx]?.signedUrl ? (
                    <InPlaceZoomViewport
                      imageKey={`left-${leftIdx}`}
                      src={images[leftIdx].signedUrl}
                      alt={images[leftIdx].fileName}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">No image</span>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-neutral-500">Site: {leftMetrics?.anatomicalSite ?? "-"}</p>
                    <p className="text-neutral-500">Diagnosis: {leftMetrics?.diagnosis ?? "-"}</p>
                    <p className="text-neutral-500">Number: {leftMetrics?.numberOfLesions ?? "-"}</p>
                    <p className="text-neutral-500">Date: {leftMetrics
                        ? new Date(leftMetrics.dateRecorded).toLocaleDateString()
                        : "-"}</p>
                  </div>
                </div>

                {/* Right card */}
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {images[rightIdx]?.fileName ?? "No image"}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {images[rightIdx]?.dateTaken
                          ? new Date(images[rightIdx].dateTaken).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {images[rightIdx]?.signedUrl ? (
                    <InPlaceZoomViewport
                      imageKey={`right-${rightIdx}`}
                      src={images[rightIdx].signedUrl}
                      alt={images[rightIdx].fileName}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">No image</span>
                    </div>
                  )}
                  <div className= "text-center">
                    <p className="text-neutral-500">Site: {rightMetrics?.anatomicalSite ?? "-"}</p>
                    <p className="text-neutral-500">Diagnosis: {rightMetrics?.diagnosis ?? "-"}</p>
                    <p className="text-neutral-500">Number: {rightMetrics?.numberOfLesions ?? "-"}</p>
                    <p className="text-neutral-500">Date: {rightMetrics
                        ? new Date(rightMetrics.dateRecorded).toLocaleDateString()
                        : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Select left / right visit to compare */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-3">
                    Select left visit
                  </p>
                  <div className="flex gap-3">
                    {images.map((img, i) => (
                      <button
                        key={img.fileName + i}
                        type="button"
                        onClick={() => setLeftIdx(i)}
                        className={`flex-1 rounded-xl border-2 ${
                          leftIdx === i
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="aspect-square bg-neutral-100">
                          <img
                            src={img.signedUrl}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs p-2 text-center">
                          <p>{img.fileName}</p>
                          <p className="text-neutral-400">
                            {img.dateTaken
                              ? new Date(img.dateTaken).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-3">
                    Select right visit
                  </p>
                  <div className="flex gap-3">
                    {images.map((img, i) => (
                      <button
                        key={img.fileName + i}
                        type="button"
                        onClick={() => setRightIdx(i)}
                        className={`flex-1 rounded-xl border-2 ${
                          rightIdx === i
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="aspect-square bg-neutral-100">
                          <img
                            src={img.signedUrl}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs p-2 text-center">
                          <p>{img.fileName}</p>
                          <p className="text-neutral-400">
                            {img.dateTaken
                              ? new Date(img.dateTaken).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Clinical Notes
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <textarea
                    placeholder="Enter comparison notes and observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-y min-h-[100px]"
                  />
                  <button
                    type="button"
                    className="shrink-0 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors self-start"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
"use client";
import Link from "next/link";
import React, { useState, useEffect, useLayoutEffect, useRef,  useCallback, useMemo, } from "react";
import Logo from "@/components/Logo";
import {
  InPlaceZoomViewport,
  MAX_ZOOM_SCALE,
  VISIT_RANGE_CLASS_NAME,
  type CompareSyncControl,
} from "@/components/dashboard/InPlaceZoomViewport";
import { Search, User } from "lucide-react";
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
  const [diagnosisAccessSaving, setDiagnosisAccessSaving] = useState(false);
  const [diagnosisAccessError, setDiagnosisAccessError] = useState<string | null>(
    null
  );

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
  const [selectedLesion, setSelectedLesion] = useState<any>(null);
  const [lesionPopup, setLesionPopup] = useState<{ x: number; y: number } | null>(null);

  function findLesionForImage(img: any, lesions: any[]) {
    if (!img) return undefined;
    return lesions.find(
      (l) =>
        new Date(l.dateRecorded).toDateString() ===
        new Date(img.dateTaken).toDateString()
    );
  }
  const leftMetrics = findLesionForImage(images[leftIdx], lesions);
  const rightMetrics = findLesionForImage(images[rightIdx], lesions);

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

  useEffect(() => {
    setDiagnosisAccessError(null);
  }, [selectedPatient?.id]);
  

  useEffect(() => {
    const max = Math.max(0, images.length - 1);
    setLeftIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
    setRightIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
  }, [images.length]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toString().includes(searchQuery)
  );

  const handleDiagnosisAccessToggle = async () => {
    if (!patientDetails || !selectedPatient || diagnosisAccessSaving) return;
    const next = !Boolean(patientDetails.hasAccessToDiagnosis);
    setDiagnosisAccessError(null);
    setDiagnosisAccessSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5023/api/doctor/patients/${selectedPatient.id}/diagnosis-access`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hasAccess: next }),
        }
      );

      if (!res.ok) {
        let message = `Could not update (${res.status})`;
        try {
          const body = await res.json();
          if (body && typeof body.error === "string") message = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const data = (await res.json()) as {
        hasAccessToDiagnosis?: boolean;
        HasAccessToDiagnosis?: boolean;
      };
      const updated =
        typeof data.hasAccessToDiagnosis === "boolean"
          ? data.hasAccessToDiagnosis
          : typeof data.HasAccessToDiagnosis === "boolean"
            ? data.HasAccessToDiagnosis
            : next;

      setPatientDetails((prev: any) =>
        prev ? { ...prev, hasAccessToDiagnosis: updated } : prev
      );
    } catch (e) {
      setDiagnosisAccessError(
        e instanceof Error ? e.message : "Update failed."
      );
    } finally {
      setDiagnosisAccessSaving(false);
    }
  };

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
                <div className="mt-4 max-w-2xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        Diagnosis access (patient portal)
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        When on, this patient can see diagnosis-related details in
                        their own dashboard. Changes save to the server.
                      </p>
                      {diagnosisAccessSaving && (
                        <p className="text-xs text-teal-600 mt-1">Saving…</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          patientDetails?.hasAccessToDiagnosis
                            ? "text-teal-700"
                            : "text-neutral-500"
                        }`}
                      >
                        {patientDetails == null
                          ? "…"
                          : patientDetails.hasAccessToDiagnosis
                            ? "On"
                            : "Off"}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-busy={diagnosisAccessSaving}
                        aria-checked={Boolean(
                          patientDetails?.hasAccessToDiagnosis
                        )}
                        aria-label="Toggle diagnosis access for patient portal"
                        disabled={
                          patientDetails == null ||
                          imagesLoading ||
                          diagnosisAccessSaving
                        }
                        onClick={() => void handleDiagnosisAccessToggle()}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          patientDetails?.hasAccessToDiagnosis
                            ? "bg-teal-600"
                            : "bg-neutral-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            patientDetails?.hasAccessToDiagnosis
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {diagnosisAccessError && (
                    <p className="text-sm text-red-600 px-1" role="alert">
                      {diagnosisAccessError}
                    </p>
                  )}
                </div>
              </div>

              {/* Comparison cards */}
              <p className="text-sm text-neutral-500 mb-4">
                Compare body photos from two visits. Use zoom to focus on a
                specific lesion; metrics below apply to the zoomed region.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-900">
                      {images[leftIdx]?.fileName ?? "No image"}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {images[leftIdx]?.dateTaken
                        ? new Date(images[leftIdx].dateTaken).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-4">
                    {images[leftIdx]?.signedUrl ? (
                      <InPlaceZoomViewport
                        imageKey={`doc-left-${selectedPatient.id}-${leftIdx}-${images[leftIdx].fileName}`}
                        src={images[leftIdx].signedUrl}
                        alt={images[leftIdx].fileName}
                        compareSync={leftCompareSync}
                        lesions={dummyLesionData.predictions[0].lesions}
                        onSelectLesion={(lesion, x, y) => {
                          setSelectedLesion(lesion);
                          setLesionPopup({ x, y });
                        }}
                        
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex items-center justify-center">
                        <span className="text-neutral-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center px-4 pt-0 pb-3 text-sm border-b border-neutral-100">
                    <p className="text-neutral-500">
                      Site: {leftMetrics?.anatomicalSite ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Diagnosis: {leftMetrics?.diagnosis ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Number: {leftMetrics?.numberOfLesions ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Date:{" "}
                      {leftMetrics
                        ? new Date(leftMetrics.dateRecorded).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  {images.length > 0 && (
                    <div className="px-4 pb-4 pt-3">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/90 px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-800">
                          <span>Left — visit</span>
                          <span className="tabular-nums text-neutral-600 shrink-0">
                            {leftIdx + 1} / {images.length}
                          </span>
                        </div>
                        <label htmlFor="doctor-compare-left-visit" className="sr-only">
                          Choose visit for left panel
                        </label>
                        <input
                          id="doctor-compare-left-visit"
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
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-900">
                      {images[rightIdx]?.fileName ?? "No image"}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {images[rightIdx]?.dateTaken
                        ? new Date(images[rightIdx].dateTaken).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-4">
                    {images[rightIdx]?.signedUrl ? (
                      <InPlaceZoomViewport
                        imageKey={`doc-right-${selectedPatient.id}-${rightIdx}-${images[rightIdx].fileName}`}
                        src={images[rightIdx].signedUrl}
                        alt={images[rightIdx].fileName}
                        compareSync={rightCompareSync}
                        lesions={dummyLesionData.predictions[0].lesions}
                        onSelectLesion={(lesion, x, y) => {
                          setSelectedLesion(lesion);
                          setLesionPopup({ x, y });
                        }}
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex items-center justify-center">
                        <span className="text-neutral-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center px-4 pt-0 pb-3 text-sm border-b border-neutral-100">
                    <p className="text-neutral-500">
                      Site: {rightMetrics?.anatomicalSite ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Diagnosis: {rightMetrics?.diagnosis ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Number: {rightMetrics?.numberOfLesions ?? "-"}
                    </p>
                    <p className="text-neutral-500">
                      Date:{" "}
                      {rightMetrics
                        ? new Date(rightMetrics.dateRecorded).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  {images.length > 0 && (
                    <div className="px-4 pb-4 pt-3">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/90 px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-800">
                          <span>Right — visit</span>
                          <span className="tabular-nums text-neutral-600 shrink-0">
                            {rightIdx + 1} / {images.length}
                          </span>
                        </div>
                        <label htmlFor="doctor-compare-right-visit" className="sr-only">
                          Choose visit for right panel
                        </label>
                        <input
                          id="doctor-compare-right-visit"
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
                      </div>
                    </div>
                  )}
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
          {selectedLesion && lesionPopup && (
            <div
              className="fixed z-50 bg-white border shadow-xl rounded-lg p-3 text-sm"
              style={{
                top: lesionPopup.y + 10,
                left: lesionPopup.x + 10,
              }}
            >
              <p className="font-semibold mb-1">Lesion</p>
              <p>ID: {selectedLesion.lesion_id}</p>
              <p>Score: {selectedLesion.score}</p>
              <p>Location: {selectedLesion.anatomical_site}</p>
              <p>Change: {selectedLesion.relative_size_change}</p>

              <button
                className="mt-2 text-xs text-red-500"
                onClick={() => {
                  setSelectedLesion(null);
                  setLesionPopup(null);
                }}
              >
                Close
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
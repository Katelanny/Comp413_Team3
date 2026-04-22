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

export default function DoctorDashboard() {
  // Consts used throughout the whole project
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [doctor, setDoctor] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [leftLesions, setLeftLesions] = useState<any[]>([]);
  const [rightLesions, setRightLesions] = useState<any[]>([]);
  const [lesions, setLesions] = useState<any[]>([]);
  const [lesionsLoading, setLesionsLoading] = useState(false);  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [diagnosisAccessSaving, setDiagnosisAccessSaving] = useState(false);
  const [diagnosisAccessError, setDiagnosisAccessError] = useState<string | null>(null);
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
  const [lesionPopups, setLesionPopups] = useState<
    { id: string; side: "left" | "right"; lesion: any; x: number; y: number }[]
  >([]);
  const handleCompareScroll = useCallback((l: number, t: number) => { setCompareScroll({ l, t });}, []);
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

  /**
   * Function ensures that both tbp images are zoomed into at the same time uniformly
   */
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

  /*
  * Function helps reset the images that have beeen zoomed into 
  */
  const handleCompareReset = useCallback(() => {
    compareZoomAnchorRef.current = null;
    setCompareScale(1);
    setCompareScroll({ l: 0, t: 0 });
    requestAnimationFrame(() => {
      leftCompareScrollRef.current?.scrollTo(0, 0);
      rightCompareScrollRef.current?.scrollTo(0, 0);
    });
  }, []);

  /*
  * effect gets information on whether either image has been scrolled down or up, so both images are moved at the same time
  */
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

  /*
  * effect sets the scale and scroll for the images
  */
  useEffect(() => {
    setCompareScale(1);
    setCompareScroll({ l: 0, t: 0 });
  }, [leftIdx, rightIdx]);

  /*
  * checks that the left side image display is insync with the right side
  */
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

  /*
  * checks that the right side image display is insync with the left side
  */
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

  /*
  * fetches the doctor dashboard storing doctor and some patient information to be displayed
  */
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

  /*
  * effect stores the selected pateint by the user
  */
  useEffect(() => {
    if (patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [patients]);
  
  /*
  * fetches more detail patient info like their images, predictions, and patient info
  */
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatient) return;
      setImagesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [detailsRes, patientRes, imagesRes] = await Promise.all([
          fetch(`http://localhost:5023/api/doctor/patients/${selectedPatient.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:5023/api/patient/${selectedPatient.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:5023/api/doctor/patients/${selectedPatient.id}/images`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!detailsRes.ok) throw new Error("Failed to fetch patient data");
        if (!patientRes.ok) throw new Error("Failed to fetch patient profile");
        const data = await detailsRes.json();
        const patientProfile = await patientRes.json();
        setPatientDetails(patientProfile); 
        const imagesData = await imagesRes.json();
        const imgs = (imagesData || [])
          .map((img: any) => ({
            id: img.imageId,
            fileName: img.url.split("/").pop()?.split("?")[0] ?? "image",
            signedUrl: img.url,
            dateTaken: img.createdAtUtc,
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

  /*
  * stores whether patient has access  to diagnosis or not
  */
  useEffect(() => {
    setDiagnosisAccessError(null);
  }, [selectedPatient?.id]);
  
  /*
  * fetches lesions for the image selected if its the image on the left
  */
  useEffect(() => {
    const image = images[leftIdx];
    if (!image?.id) return;

    fetchLesionsForImage(image.id, "left");
  }, [leftIdx, images]);

  /*
  * fetches lesion for the image slected if its the image on the right
  */
  useEffect(() => {
    const image = images[rightIdx];
    if (!image?.id) return;

    fetchLesionsForImage(image.id, "right");
  }, [rightIdx, images]);

  /*
  * checks which image was selected by the user
  */
  useEffect(() => {
    const max = Math.max(0, images.length - 1);
    setLeftIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
    setRightIdx((i) => (images.length === 0 ? 0 : Math.min(i, max)));
  }, [images.length]);

  /*
  * filters patients by name for the search bar on the left side
  */
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toString().includes(searchQuery)
  );

  /*
  * fetch the api to change the diagnosis access for a patient
  */
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

  /*
  * logs out the user
  */
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

  /*
  * fetches the lesion for the image displayed
  */
  const fetchLesionsForImage = async (
    imageId: string | number,
    side: "left" | "right"
  ) => {
    try {
      setLesionsLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5023/api/prediction/${imageId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "text/plain",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lesions");

      const data = await res.json();
      const lesions = data.predictions?.[0]?.lesions || [];

      if (side === "left") {
        setLeftLesions(lesions);
      } else {
        setRightLesions(lesions);
      }
    } catch (err) {
      console.error(`Lesion fetch error (${side}):`, err);

      if (side === "left") setLeftLesions([]);
      else setRightLesions([]);
    } finally {
      setLesionsLoading(false);
    }
  };

  /*
  * ensures the lesion popup is shown for the left hand side
  */
  useEffect(() => {
    setLesionPopups((prev) =>
      prev.filter((p) => p.side !== "left")
    );
  }, [leftIdx]);

  /*
  * esnures the lesion popup is shown for the right hand side
  */
  useEffect(() => {
    setLesionPopups((prev) =>
      prev.filter((p) => p.side !== "right")
    );
  }, [rightIdx]);
  

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Header info display */}
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
                {/* Patient access control */}
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

              {/* Comparison image display*/}
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
                      <>
                        {lesionsLoading && (
                          <p className="text-xs text-neutral-400">Loading lesions...</p>
                        )}
                        <InPlaceZoomViewport
                          imageKey={`doc-left-${selectedPatient.id}-${leftIdx}-${images[leftIdx].fileName}`}
                          src={images[leftIdx].signedUrl}
                          alt={images[leftIdx].fileName}
                          compareSync={leftCompareSync}
                          lesions={leftLesions}
                          onSelectLesion={(lesion, x, y) => {
                            const id = `${Date.now()}-${Math.random()}`;

                            setLesionPopups((prev) => [
                              ...prev,
                              { id, side: "left", lesion, x, y },
                            ]);
                          }}
                        />
                      </>
                    ) : (
                      <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex items-center justify-center">
                        <span className="text-neutral-400 text-sm">No image</span>
                      </div>
                    )}
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
                    {images[leftIdx]?.signedUrl ? (
                      <>
                        {lesionsLoading && (
                          <p className="text-xs text-neutral-400">Loading lesions...</p>
                        )}
                        <InPlaceZoomViewport
                          imageKey={`doc-right-${selectedPatient.id}-${rightIdx}-${images[rightIdx].fileName}`}
                          src={images[rightIdx].signedUrl}
                          alt={images[leftIdx].fileName}
                          compareSync={rightCompareSync}
                          lesions={rightLesions}
                          onSelectLesion={(lesion, x, y) => {
                            const id = `${Date.now()}-${Math.random()}`;

                            setLesionPopups((prev) => [
                              ...prev,
                              { id, side: "right", lesion, x, y },
                            ]);
                          }}
                        />
                      </>
                    ) : (
                      <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex items-center justify-center">
                        <span className="text-neutral-400 text-sm">No image</span>
                      </div>
                    )}
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
          {/* lesion popup display*/}
          {lesionPopups.map((popup) => (
            <div
              key={popup.id}
              className="fixed z-50 bg-white border shadow-xl rounded-lg p-3 text-sm"
              style={{
                top: popup.y + 10,
                left: popup.x + 10,
              }}
            >
              <p className="font-semibold mb-1">Lesion</p>
              <p>ID: {popup.lesion.lesion_id}</p>
              <p>Score: {popup.lesion.score}</p>
              <p>Location: {popup.lesion.anatomical_site}</p>
              <p>Change: {popup.lesion.relative_size_change}</p>

              <button
                className="mt-2 text-xs text-red-500"
                onClick={() => {
                  setLesionPopups((prev) =>
                    prev.filter((p) => p.id !== popup.id)
                  );
                }}
              >
                Close
              </button>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
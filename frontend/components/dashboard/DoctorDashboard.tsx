"use client";
import Link from 'next/link'
import React, { useState } from "react";
import Logo from "@/components/Logo";
import {
  Search,
  ChevronRight,
  GitCompare,
  History,
  LayoutGrid,
  Download,
  Printer,
  ZoomIn,
  Pencil,
  User,
} from "lucide-react";
//hard coded temporarily
const PATIENTS = [
  { id: "1", name: "Steven Lesley", mrn: "12345", lastVisit: "2026-01-28" },
  { id: "2", name: "Michael Randolph", mrn: "12346", lastVisit: "2026-01-25" },
  { id: "3", name: "John Doe", mrn: "12347", lastVisit: "2026-01-20" },
];

const TIMEPOINTS = [
  { id: "baseline", label: "Baseline", date: "2025-08-15" },
  { id: "3m", label: "3 months", date: "2025-11-20" },
  { id: "6m", label: "6 months", date: "2026-02-01" },
];

const LEFT_METRICS = {
  size: "9.4mm x 7.8mm",
  area: "58.1 mm²",
  colorScore: "2.1/5",
  asymmetry: "Low",
};

const RIGHT_METRICS = {
  size: "8.2mm x 6.5mm",
  area: "42.3 mm²",
  colorScore: "2.4/5",
  asymmetry: "Low",
};

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [leftImage, setLeftImage] = useState("baseline");
  const [rightImage, setRightImage] = useState("6m");
  const [notes, setNotes] = useState("");

  const filteredPatients = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.includes(searchQuery)
  );

  const leftTimepoint = TIMEPOINTS.find((t) => t.id === leftImage)!;
  const rightTimepoint = TIMEPOINTS.find((t) => t.id === rightImage)!;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-xl font-medium">Doctor Dashboard</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-600">
          <span className="font-medium">Dr. Amanda Richards</span>
          <span className="text-sm">Dermatology</span>
          <button type="button" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Menu">
            <Link href="/" className="text-teal-600 font-medium hover:text-teal-700 transition-colors" >
              Logout
            </Link>
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
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {filteredPatients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                    selectedPatient.id === patient.id
                      ? "bg-teal-600 text-white"
                      : "hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      selectedPatient.id === patient.id
                        ? "bg-white/20"
                        : "bg-neutral-200"
                    }`}
                  >
                    <User size={20} className={selectedPatient.id === patient.id ? "text-white" : "text-neutral-500"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{patient.name}</p>
                    <p
                      className={`text-sm truncate ${
                        selectedPatient.id === patient.id
                          ? "text-teal-100"
                          : "text-neutral-500"
                      }`}
                    >
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
          {/* Patient info bar */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {selectedPatient.name}
              </h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                MRN: {selectedPatient.mrn} | DOB: 05/14/1978
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: GitCompare, label: "Compare" },
                { icon: History, label: "Timeline" }
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison: body photos over time; zoom to focus on a lesion */}
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
                    {leftTimepoint.label}
                  </h3>
                  <p className="text-sm text-neutral-500">{leftTimepoint.date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                    aria-label="Zoom in on lesion"
                    title="Zoom in on lesion"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                    aria-label="Edit / annotate"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </div>
              <div className="aspect-[4/3] bg-neutral-100 relative flex flex-col items-center justify-center gap-1">
                <span className="text-neutral-400 text-sm">Body photo</span>
                <span className="text-neutral-400 text-xs">Zoom to view lesion</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-500">Size</p>
                  <p className="font-medium">{LEFT_METRICS.size}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Area</p>
                  <p className="font-medium">{LEFT_METRICS.area}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Color Score</p>
                  <p className="font-medium">{LEFT_METRICS.colorScore}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Asymmetry</p>
                  <p className="font-medium">{LEFT_METRICS.asymmetry}</p>
                </div>
              </div>
            </div>

            {/* Right card */}
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {rightTimepoint.label}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {rightTimepoint.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                    aria-label="Zoom"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                    aria-label="Edit / annotate"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </div>
              <div className="aspect-[4/3] bg-neutral-100 relative flex flex-col items-center justify-center gap-1">
                <span className="text-neutral-400 text-sm">Body photo</span>
                <span className="text-neutral-400 text-xs">Zoom to view lesion</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-500">Size</p>
                  <p className="font-medium">{RIGHT_METRICS.size}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Area</p>
                  <p className="font-medium">{RIGHT_METRICS.area}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Color Score</p>
                  <p className="font-medium">{RIGHT_METRICS.colorScore}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Asymmetry</p>
                  <p className="font-medium">{RIGHT_METRICS.asymmetry}</p>
                </div>
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
                {TIMEPOINTS.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setLeftImage(tp.id)}
                    className={`flex-1 min-w-0 rounded-xl border-2 overflow-hidden transition-colors ${
                      leftImage === tp.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-400 text-xs">Photo</span>
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium truncate">{tp.label}</p>
                      <p className="text-xs text-neutral-500">{tp.date}</p>
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
                {TIMEPOINTS.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setRightImage(tp.id)}
                    className={`flex-1 min-w-0 rounded-xl border-2 overflow-hidden transition-colors ${
                      rightImage === tp.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-400 text-xs">Photo</span>
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium truncate">{tp.label}</p>
                      <p className="text-xs text-neutral-500">{tp.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Analysis */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Comparison Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-semibold text-green-600">
                  -12.5%
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Size Change
                </p>
                <p className="text-xs text-neutral-400">
                  Between selected timepoints
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-700">
                  Stable
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Color Change
                </p>
                <p className="text-xs text-neutral-400">
                  No significant change
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-600">+5%</p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Border Irregularity
                </p>
                <p className="text-xs text-neutral-400">Slight increase</p>
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
        </main>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Logo from "@/components/Logo";
import {
  ChevronRight,
  Info,
  GitCompare,
  History,
  Download,
} from "lucide-react";

const TIMEPOINTS = [
  { id: "baseline", label: "Baseline", date: "2025-08-15" },
  { id: "3m", label: "3 months", date: "2025-11-20" },
  { id: "6m", label: "6 months", date: "2026-02-01" },
];

const LEFT_METRICS = { size: "9.4mm x 7.8mm", area: "58.1 mm²" };
const RIGHT_METRICS = { size: "8.2mm x 6.5mm", area: "42.3 mm²" };

export default function PatientDashboard() {
  const [viewMode, setViewMode] = useState<"compare" | "timeline">("compare");
  const [leftImage, setLeftImage] = useState("baseline");
  const [rightImage, setRightImage] = useState("6m");

  const leftTimepoint = TIMEPOINTS.find((t) => t.id === leftImage)!;
  const rightTimepoint = TIMEPOINTS.find((t) => t.id === rightImage)!;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Lesion Tracker
            </h1>
            <p className="text-sm text-neutral-500">My Health Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-neutral-600">
          <div className="text-right">
            <p className="font-medium text-neutral-900">Sarah Johnson</p>
            <p className="text-sm text-neutral-500">Patient Portal</p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Menu"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 w-full space-y-6">
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

        {/* Tracked regions / visit summary */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Tracked body regions
          </h2>
          <p className="text-neutral-500 text-sm mb-4">
            Body photos are grouped by region. Zoom in on a photo to view and
            compare lesions in that area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-neutral-500 mb-0.5">Regions</p>
              <p className="font-medium text-neutral-900">Left forearm, Back</p>
            </div>
            <div>
              <p className="text-neutral-500 mb-0.5">First visit</p>
              <p className="font-medium text-neutral-900">August 15, 2025</p>
            </div>
            <div>
              <p className="text-neutral-500 mb-0.5">Total visits</p>
              <p className="font-medium text-neutral-900">3 visits</p>
            </div>
          </div>
        </section>

        {/* Image Timeline */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Photos over time
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Select two visits to compare. Zoom in to focus on a specific
                lesion.
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
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Two large image comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="text-neutral-400 text-sm">
                    Body photo
                  </span>
                  <span className="text-neutral-400 text-xs">Zoom in to view lesion</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {leftTimepoint.label}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {leftTimepoint.date}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">
                    Size: {LEFT_METRICS.size}
                  </p>
                  <p className="text-sm text-neutral-700">
                    Area: {LEFT_METRICS.area}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-neutral-100 rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="text-neutral-400 text-sm">
                    Body photo
                  </span>
                  <span className="text-neutral-400 text-xs">Zoom in to view lesion</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {rightTimepoint.label}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {rightTimepoint.date}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">
                    Size: {RIGHT_METRICS.size}
                  </p>
                  <p className="text-sm text-neutral-700">
                    Area: {RIGHT_METRICS.area}
                  </p>
                </div>
              </div>
            </div>

            {/* Select Left Image / Select Right Image - side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
<p className="text-sm font-medium text-neutral-600 mb-3">
                Select left visit
              </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {TIMEPOINTS.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setLeftImage(tp.id)}
                      className={`shrink-0 w-28 rounded-xl border-2 overflow-hidden transition-colors ${
                        leftImage === tp.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                        <span className="text-neutral-400 text-xs">
                          Photo
                        </span>
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
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {TIMEPOINTS.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setRightImage(tp.id)}
                      className={`shrink-0 w-28 rounded-xl border-2 overflow-hidden transition-colors ${
                        rightImage === tp.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                        <span className="text-neutral-400 text-xs">
                          Photo
                        </span>
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
          </div>
        </section>

        {/* Progress Update */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="font-bold text-neutral-900 mb-2">Progress Update</h3>
          <p className="text-neutral-700 text-sm leading-relaxed">
            Comparing these images shows a 12.5% decrease in lesion size. Your
            doctor notes this is a positive response to treatment.
          </p>
        </section>

        {/* What Your Doctor Says */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            What Your Doctor Says
          </h2>
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="font-bold text-neutral-900 mb-1">Good News</h3>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Your lesion has shown a 12.5% decrease in size since your first
                visit. Continue monitoring as recommended.
              </p>
            </div>
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4">
              <h3 className="font-bold text-neutral-900 mb-1">Next Steps</h3>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Continue your current treatment plan. Schedule your next
                follow-up appointment in 3 months to track progress.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

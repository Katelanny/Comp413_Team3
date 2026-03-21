"use client";

import React from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import {
  ChevronRight,
  Activity,
  Database,
  Server,
  Users,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

// Mock data for now,  replace with the real API calls later
const SYSTEM_SERVICES = [
  { name: "API", status: "operational", latency: "42 ms", icon: Server },
  { name: "Database", status: "operational", latency: "8 ms", icon: Database },
  { name: "Frontend", status: "operational", latency: "—", icon: Activity },
];

const METRICS = [
  { label: "Active users", value: "12", sub: "Last 15 min", icon: Users },
  { label: "Storage used", value: "2.4 GB", sub: "of 10 GB", icon: HardDrive },
  { label: "Uptime", value: "99.98%", sub: "30 days", icon: Clock },
];

const RECENT_ACTIVITY = [
  { time: "2 min ago", event: "User login", detail: "Doctor dashboard", type: "info" },
  { time: "5 min ago", event: "Export completed", detail: "Patient 12345", type: "info" },
  { time: "12 min ago", event: "New patient record", detail: "MRN 12348", type: "info" },
  { time: "1 hour ago", event: "Scheduled backup", detail: "Completed successfully", type: "success" },
  { time: "2 hours ago", event: "API deploy", detail: "v1.2.0", type: "info" },
];

const ALERTS = [
  { id: "1", message: "Storage at 24% capacity. No action needed.", severity: "low" },
];

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "operational";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
        isOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {isOk ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Lesion Tracker</h1>
            <p className="text-sm text-neutral-500">System Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Menu"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* System health */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              System health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SYSTEM_SERVICES.map((svc) => {
                const Icon = svc.icon;
                return (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Icon className="text-teal-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{svc.name}</p>
                        {svc.latency !== "—" && (
                          <p className="text-xs text-neutral-500">
                            {svc.latency}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={svc.status} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Metrics */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {METRICS.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="p-4 rounded-xl border border-neutral-200"
                  >
                    <div className="flex items-center gap-2 text-neutral-500 mb-1">
                      <Icon size={16} />
                      <span className="text-sm">{m.label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {m.value}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{m.sub}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Alerts (if any) */}
          {ALERTS.length > 0 && (
            <section className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <h2 className="text-sm font-semibold text-amber-900 mb-2">
                Notices
              </h2>
              <ul className="space-y-1">
                {ALERTS.map((a) => (
                  <li
                    key={a.id}
                    className="text-sm text-amber-800 flex items-center gap-2"
                  >
                    <AlertCircle size={14} />
                    {a.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recent activity */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              Recent activity
            </h2>
            <ul className="divide-y divide-neutral-100">
              {RECENT_ACTIVITY.map((item, i) => (
                <li
                  key={i}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.event}</p>
                    <p className="text-sm text-neutral-500">{item.detail}</p>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {item.time}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

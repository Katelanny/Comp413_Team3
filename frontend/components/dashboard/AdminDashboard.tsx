"use client";

import React, { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import {
  Activity,
  Database,
  Server,
  Users,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Stethoscope,
  Shield,
} from "lucide-react";
function emailFromJwt(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const o = JSON.parse(atob(padded)) as { email?: string };
    return o.email ?? null;
  } catch {
    return null;
  }
}

type PatientRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAtUtc: string;
};

type DoctorRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAtUtc: string;
};

type AdminRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAtUtc: string;
  lastLoginAtUtc: string;
};

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

function formatRelative(iso: string) {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [me, setMe] = useState<AdminRow | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [dbLatencyMs, setDbLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      try {
        const t0 = performance.now();
        const pRes = await fetch("http://localhost:5023/api/patient", {
          headers,
        });
        const t1 = performance.now();
        setApiLatencyMs(Math.round(t1 - t0));

        const tDb0 = performance.now();
        const dRes = await fetch("http://localhost:5023/api/doctor", {
          headers,
        });
        const tDb1 = performance.now();
        setDbLatencyMs(Math.round(tDb1 - tDb0));

        if (!pRes.ok) throw new Error("Failed to load patients.");
        if (!dRes.ok) throw new Error("Failed to load doctors.");

        const pData: PatientRow[] = await pRes.json();
        const dData: DoctorRow[] = await dRes.json();
        setPatients(pData);
        setDoctors(dData);

        const aRes = await fetch("http://localhost:5023/api/admin", {
          headers,
        });
        if (!aRes.ok) throw new Error("Failed to load admins.");
        const aData: AdminRow[] = await aRes.json();
        setAdmins(aData);

        const email = emailFromJwt(token);
        if (email) {
          const found = aData.find(
            (a) => a.email?.toLowerCase() === email.toLowerCase()
          );
          setMe(found ?? null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recentPatients = [...patients]
    .sort(
      (a, b) =>
        new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime()
    )
    .slice(0, 5);

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

  const displayName = me
    ? `${me.firstName} ${me.lastName}`.trim()
    : loading
      ? "Loading…"
      : "Admin";

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Lesion Tracker</h1>
            <p className="text-sm text-neutral-500">System Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="font-medium text-neutral-900">{displayName}</p>
            {me?.email && (
              <p className="text-neutral-500 text-xs">{me.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="max-w-6xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              System health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Server className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">API</p>
                    <p className="text-xs text-neutral-500">
                      {apiLatencyMs != null ? `${apiLatencyMs} ms` : "—"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={error ? "degraded" : "operational"} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Database className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Database</p>
                    <p className="text-xs text-neutral-500">
                      {dbLatencyMs != null ? `${dbLatencyMs} ms` : "—"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={error ? "degraded" : "operational"} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Activity className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Frontend</p>
                    <p className="text-xs text-neutral-500">This app</p>
                  </div>
                </div>
                <StatusBadge status="operational" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Users size={16} />
                  <span className="text-sm">Patients</span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {loading ? "…" : patients.length}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">In database</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Stethoscope size={16} />
                  <span className="text-sm">Doctors</span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {loading ? "…" : doctors.length}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">In database</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Shield size={16} />
                  <span className="text-sm">Admins</span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {loading ? "…" : admins.length}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">In database</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              Recent patient registrations
            </h2>
            {recentPatients.length === 0 && !loading ? (
              <p className="text-sm text-neutral-500">No patient records yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recentPatients.map((p) => (
                  <li
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-sm text-neutral-500">{p.email}</p>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0">
                      {formatRelative(p.createdAtUtc)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              Placeholder metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 border-dashed">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <HardDrive size={16} />
                  <span className="text-sm">Storage</span>
                </div>
                <p className="text-sm text-neutral-500">
                  Not exposed by API yet. Placeholder
                </p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 border-dashed">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Clock size={16} />
                  <span className="text-sm">Uptime</span>
                </div>
                <p className="text-sm text-neutral-500">
                  Not exposed by API yet. Placeholder
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

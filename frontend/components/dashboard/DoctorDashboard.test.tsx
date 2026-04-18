import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DoctorDashboard from "@/components/dashboard/DoctorDashboard";
import { jsonResponse } from "@/test/jsonResponse";

vi.mock("next/link", () => {
  function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  }
  return { default: MockLink };
});

type DashboardPatientRow = {
  patientId: number;
  firstName: string;
  lastName: string;
  lastVisitDate: string | null;
  email: string;
};

describe("DoctorDashboard", () => {
  let diagnosisPatchMode: "success" | "fail";
  let dashboardPatients: DashboardPatientRow[];

  const defaultPatients: DashboardPatientRow[] = [
    {
      patientId: 1,
      firstName: "Pat",
      lastName: "One",
      lastVisitDate: null,
      email: "pat@example.com",
    },
  ];

  beforeEach(() => {
    diagnosisPatchMode = "success";
    dashboardPatients = [...defaultPatients];

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/doctor/dashboard")) {
          return jsonResponse({
            firstName: "Jane",
            lastName: "Doctor",
            patients: dashboardPatients,
          });
        }

        if (url.match(/\/api\/doctor\/patients\/\d+\/diagnosis-access/)) {
          if (diagnosisPatchMode === "fail") {
            return jsonResponse({ error: "Visit not found" }, false, 403);
          }
          return jsonResponse({
            patientId: 1,
            hasAccessToDiagnosis: true,
          });
        }

        if (
          url.match(/\/api\/doctor\/patients\/\d+$/) &&
          init?.method !== "PATCH"
        ) {
          return jsonResponse({ images: [], lesions: [] });
        }

        const profileMatch = url.match(/\/api\/patient\/(\d+)$/);
        if (profileMatch) {
          const id = profileMatch[1];
          if (id === "1") {
            return jsonResponse({
              hasAccessToDiagnosis: false,
              dateOfBirth: "1990-01-01",
              email: "pat@example.com",
              phone: "555",
              gender: "U",
            });
          }
          if (id === "2") {
            return jsonResponse({
              hasAccessToDiagnosis: true,
              dateOfBirth: "1985-06-15",
              email: "sam@example.com",
              phone: "222",
              gender: "F",
            });
          }
        }

        return jsonResponse({}, false, 404);
      })
    );

    const store: Record<string, string> = { token: "test-token" };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key) => store[key] ?? null
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("session and patient list", () => {
    it("loads doctor name from dashboard and sends Bearer token", async () => {
      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Jane Doctor")).toBeInTheDocument();
      });

      const dashCall = vi.mocked(fetch).mock.calls.find(([u]) =>
        String(u).includes("/api/doctor/dashboard")
      );
      expect(dashCall).toBeDefined();
      const init = dashCall![1] as RequestInit;
      expect(init?.method ?? "GET").toBe("GET");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-token");
    });

    it("lists patients from the dashboard response in the sidebar", async () => {
      dashboardPatients = [
        ...defaultPatients,
        {
          patientId: 2,
          firstName: "Sam",
          lastName: "Two",
          lastVisitDate: "2026-03-01T12:00:00.000Z",
          email: "sam@example.com",
        },
      ];

      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Pat One")).toBeInTheDocument();
      });
      expect(screen.getByText("Sam Two")).toBeInTheDocument();
      expect(screen.getByText(/MRN:\s*1/)).toBeInTheDocument();
      expect(screen.getByText(/MRN:\s*2/)).toBeInTheDocument();
    });

    it("filters the sidebar when searching by name or MRN", async () => {
      const user = userEvent.setup();
      dashboardPatients = [
        ...defaultPatients,
        {
          patientId: 2,
          firstName: "Sam",
          lastName: "Two",
          lastVisitDate: null,
          email: "sam@example.com",
        },
      ];

      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Sam Two")).toBeInTheDocument();
      });

      const search = screen.getByPlaceholderText("Search patients...");
      const sidebar = search.closest("aside") as HTMLElement;

      await user.type(search, "Sam");

      expect(within(sidebar).queryByText("Pat One")).not.toBeInTheDocument();
      expect(within(sidebar).getByText("Sam Two")).toBeInTheDocument();

      await user.clear(search);
      await user.type(search, "2");

      expect(within(sidebar).queryByText("Pat One")).not.toBeInTheDocument();
      expect(within(sidebar).getByText("Sam Two")).toBeInTheDocument();
    });

    it("selecting another patient loads that patient profile in the main panel", async () => {
      const user = userEvent.setup();
      dashboardPatients = [
        ...defaultPatients,
        {
          patientId: 2,
          firstName: "Sam",
          lastName: "Two",
          lastVisitDate: null,
          email: "sam@example.com",
        },
      ];

      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: "Pat One" })
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /Sam Two[\s\S]*MRN: 2/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: "Sam Two" })
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/sam@example\.com/)).toBeInTheDocument();

      const patientTwoCalls = vi.mocked(fetch).mock.calls.filter(([u]) =>
        String(u).endsWith("/api/patient/2")
      );
      expect(patientTwoCalls.length).toBeGreaterThan(0);
    });
  });

  describe("diagnosis access toggle", () => {
    it("PATCHes diagnosis access when toggled on", async () => {
      diagnosisPatchMode = "success";
      const user = userEvent.setup();
      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: "Pat One" })
        ).toBeInTheDocument();
      });

      const diagnosisSwitch = screen.getByRole("switch", {
        name: /toggle diagnosis access for patient portal/i,
      });

      await waitFor(() => {
        expect(diagnosisSwitch).not.toBeDisabled();
      });

      expect(diagnosisSwitch).toHaveAttribute("aria-checked", "false");

      await user.click(diagnosisSwitch);

      await waitFor(() => {
        expect(diagnosisSwitch).toHaveAttribute("aria-checked", "true");
      });

      const patchCall = vi.mocked(fetch).mock.calls.find(
        ([u, init]) =>
          String(u).includes("/diagnosis-access") && init?.method === "PATCH"
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({
        hasAccess: true,
      });
    });

    it("shows server error when PATCH fails", async () => {
      diagnosisPatchMode = "fail";
      const user = userEvent.setup();
      render(<DoctorDashboard />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: "Pat One" })
        ).toBeInTheDocument();
      });

      const diagnosisSwitch = screen.getByRole("switch", {
        name: /toggle diagnosis access for patient portal/i,
      });

      await waitFor(() => {
        expect(diagnosisSwitch).not.toBeDisabled();
      });

      await user.click(diagnosisSwitch);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Visit not found");
      });

      expect(diagnosisSwitch).toHaveAttribute("aria-checked", "false");
    });
  });
});

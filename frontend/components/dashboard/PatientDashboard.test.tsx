import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PatientDashboard from "@/components/dashboard/PatientDashboard";
import { jsonResponse } from "@/test/jsonResponse";

vi.mock("@/components/dashboard/InPlaceZoomViewport", () => ({
  InPlaceZoomViewport: ({ alt }: { alt: string }) => (
    <div data-testid="zoom-viewport">{alt}</div>
  ),
  MAX_ZOOM_SCALE: 10,
  VISIT_RANGE_CLASS_NAME: "mock-range",
}));

function stubDashboardFetch(body: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/patient/dashboard")) {
        return jsonResponse(body);
      }
      return jsonResponse({}, false, 404);
    })
  );
}

function stubToken() {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) =>
    key === "token" ? "test-jwt" : null
  );
}

describe("PatientDashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("session", () => {
    it("shows not signed in when there is no token", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Not signed in.")).toBeInTheDocument();
      });
    });

    it("calls dashboard GET with Bearer token and shows header + onboarding", async () => {
      stubDashboardFetch({
        firstName: "Alice",
        lastName: "Recipient",
        email: "alice@example.com",
        hasAccessToDiagnosis: true,
        images: [],
        lesions: [],
      });
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Alice Recipient")).toBeInTheDocument();
      });

      const dash = vi.mocked(fetch).mock.calls.find(([u]) =>
        String(u).includes("/api/patient/dashboard")
      );
      expect(dash).toBeDefined();
      const init = dash![1] as RequestInit;
      expect(init?.method ?? "GET").toBe("GET");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-jwt");

      expect(screen.getByText("My Health Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Patient Portal")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Tracking Your Progress" })
      ).toBeInTheDocument();
    });
  });

  describe("API errors", () => {
    it("shows session expired when the API returns 401", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => jsonResponse({}, false, 401))
      );
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Session expired. Please log in again.")
        ).toBeInTheDocument();
      });
    });

    it("shows a generic error when the API returns non-OK", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => jsonResponse({ message: "bad" }, false, 500))
      );
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Could not load your dashboard.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("profile and photos section", () => {
    it("shows email, lesion and photo counts, diagnosis access, and empty-photos copy", async () => {
      stubDashboardFetch({
        firstName: "Bob",
        lastName: "Patient",
        email: "bob@example.com",
        hasAccessToDiagnosis: false,
        images: [],
        lesions: [
          {
            id: 1,
            anatomicalSite: "back",
            diagnosis: null,
            numberOfLesions: 1,
            dateRecorded: "2026-01-01T00:00:00.000Z",
          },
          {
            id: 2,
            anatomicalSite: "arm",
            diagnosis: "Nevus",
            numberOfLesions: 2,
            dateRecorded: "2026-01-02T00:00:00.000Z",
          },
        ],
      });
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      });

      const lesionsLabel = screen.getByText("Tracked lesions");
      expect(
        lesionsLabel.parentElement?.querySelector(".font-medium")
      ).toHaveTextContent("2");

      const photosLabel = screen.getByText("Photos linked");
      expect(
        photosLabel.parentElement?.querySelector(".font-medium")
      ).toHaveTextContent("0");

      expect(screen.getByText(/Diagnosis access:\s*No/)).toBeInTheDocument();

      expect(
        screen.getByText(
          "No photos are linked to your account yet. Your care team will add images after your visits."
        )
      ).toBeInTheDocument();
    });

    it("switches Photos over time subtitle between Compare and Timeline", async () => {
      const user = userEvent.setup();
      stubDashboardFetch({
        firstName: "C",
        lastName: "User",
        email: "c@example.com",
        hasAccessToDiagnosis: true,
        images: [],
        lesions: [],
      });
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(screen.getByText("C User")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Select two photos to compare.")
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Timeline$/i }));

      expect(
        screen.getByText("Step through photos in order with the slider.")
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Compare$/i }));

      expect(
        screen.getByText("Select two photos to compare.")
      ).toBeInTheDocument();
    });

    it("with photos, Compare shows visit controls and Timeline shows photo thumbnails", async () => {
      const user = userEvent.setup();
      stubDashboardFetch({
        firstName: "Dana",
        lastName: "Photo",
        email: "dana@example.com",
        hasAccessToDiagnosis: true,
        images: [
          { fileName: "visit-a.jpg", url: "https://example.com/a.jpg" },
          { fileName: "visit-b.jpg", url: "https://example.com/b.jpg" },
        ],
        lesions: [],
      });
      stubToken();

      render(<PatientDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Left — visit")).toBeInTheDocument();
      });
      expect(screen.getByText("Right — visit")).toBeInTheDocument();
      expect(screen.getAllByText("visit-a.jpg").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("visit-b.jpg").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId("zoom-viewport")).toHaveLength(2);

      await user.click(screen.getByRole("button", { name: /^Timeline$/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: "Photo 1 of 2" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Photo 2 of 2" })
      ).toBeInTheDocument();
    });
  });
});

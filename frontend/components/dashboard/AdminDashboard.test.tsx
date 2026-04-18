import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { jsonResponse } from "@/test/jsonResponse";

/**
 * Builds a minimal JWT string so emailFromJwt in AdminDashboard can
 * read `localStorage.token`: segment 2 is base64url JSON `{ email }`, matching
 * how the real login token is shaped. Header and signature are dummies + only
 * the payload is parsed in tests.
 */
function jwtWithEmail(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `e30.${payload}.sig`;
}

describe("AdminDashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads system admin overview and resolves signed-in admin from JWT", async () => {
    const iso = "2026-01-15T12:00:00.000Z";
    const patients = [
      {
        id: 1,
        firstName: "P",
        lastName: "One",
        email: "p1@example.com",
        createdAtUtc: iso,
      },
    ];
    const doctors = [
      {
        id: 10,
        firstName: "D",
        lastName: "One",
        email: "d1@example.com",
        createdAtUtc: iso,
      },
    ];
    const admins = [
      {
        id: 99,
        firstName: "Sys",
        lastName: "Admin",
        email: "admin@example.com",
        createdAtUtc: iso,
        lastLoginAtUtc: iso,
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.endsWith("/api/patient")) return jsonResponse(patients);
        if (url.endsWith("/api/doctor")) return jsonResponse(doctors);
        if (url.endsWith("/api/admin")) return jsonResponse(admins);
        return jsonResponse({}, false, 404);
      })
    );

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) =>
      key === "token" ? jwtWithEmail("admin@example.com") : null
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("System Admin")).toBeInTheDocument();
    });

    expect(screen.getByText("Sys Admin")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("P One")).toBeInTheDocument();
    });
    expect(screen.getByText("Recent patient registrations")).toBeInTheDocument();
  });

  it("shows an error when the patients endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.endsWith("/api/patient")) {
          return jsonResponse({ message: "nope" }, false, 500);
        }
        if (url.endsWith("/api/doctor")) return jsonResponse([]);
        if (url.endsWith("/api/admin")) return jsonResponse([]);
        return jsonResponse({}, false, 404);
      })
    );

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load patients.")
      ).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "@/components/Login";
import { jsonResponse } from "@/test/jsonResponse";

vi.mock("next/image", () => ({
  default: function MockImage({ alt, src }: { alt: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} width={400} height={300} />;
  },
}));

describe("Login — doctor", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        jsonResponse({
          token: "jwt-from-backend",
          role: "doctor",
        })
      )
    );
    vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("submits credentials to login API and stores token when portal matches doctor role", async () => {
    const user = userEvent.setup();
    const noop = () => {};
    render(<Login onNavigateToRegister={noop} />);

    await user.click(screen.getByRole("button", { name: /^Doctor$/i }));
    await user.type(screen.getByPlaceholderText("Username"), "dr.house");
    await user.type(screen.getByPlaceholderText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /^Log in$/i }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        "http://localhost:5023/api/account/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "dr.house",
            password: "secret",
          }),
        })
      );
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "token",
      "jwt-from-backend"
    );
  });

  it("shows a message when backend role does not match selected portal", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      jsonResponse({ token: "x", role: "patient" })
    );

    const user = userEvent.setup();
    render(<Login onNavigateToRegister={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^Doctor$/i }));
    await user.type(screen.getByPlaceholderText("Username"), "u");
    await user.type(screen.getByPlaceholderText("Password"), "p");
    await user.click(screen.getByRole("button", { name: /^Log in$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/You are registered as a patient, not a doctor/)
      ).toBeInTheDocument();
    });

    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});

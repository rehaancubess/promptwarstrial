import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import React from "react";

// Mock Firebase
vi.mock("./firebase", () => ({
  auth: { currentUser: { uid: "123" } },
  googleProvider: {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  // Ensure we immediately mock log in success
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: "123" });
    return () => {}; // return unsubscribe function
  }),
}));

describe("App Component", () => {
  it("renders the Dashboard view after authenticating", async () => {
    render(<App />);

    await waitFor(() => {
      // "New Report" banner is in the dashboard view
      expect(screen.getByText(/New Report/i)).toBeInTheDocument();
    });
  });

  it("has accessible main navigation buttons", async () => {
    render(<App />);
    await waitFor(() => {
      // Use exact aria-label match for the nav History button specifically
      const dashboardBtn = screen.getByRole("button", { name: "Dashboard" });
      expect(dashboardBtn).toBeInTheDocument();
      const historyBtn = screen.getByRole("button", { name: "History" });
      expect(historyBtn).toBeInTheDocument();
    });
  });
});

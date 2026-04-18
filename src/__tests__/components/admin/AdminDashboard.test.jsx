// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { adminService } from "../../services/adminService";

vi.mock("../../services/adminService", () => ({
  adminService: {
    list: vi.fn()
  }
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.list.mockResolvedValue({
      items: [{ id: 1, university_name: "Test Uni" }],
      total: 1,
      page: 0,
      pages: 1
    });
  });

  it("renders sidebar with tables and main heading", async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Panel/i)).toBeTruthy();
  });

  it("handles pagination clicks", async () => {
    // Initial load: Page 0
    adminService.list.mockResolvedValue({
      items: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })),
      total: 15,
      page: 0,
      pages: 2
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(adminService.list).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ page: 0 })));

    // Click next page
    const nextBtns = screen.getAllByText(/Следваща/i);
    const nextBtn = nextBtns[nextBtns.length - 1]; // Pick the last one (usually pagination)
    
    // Update mock for next page
    adminService.list.mockResolvedValue({
      items: Array.from({ length: 5 }, (_, i) => ({ id: i + 11, name: `Item ${i + 11}` })),
      total: 15,
      page: 1,
      pages: 2
    });

    fireEvent.click(nextBtn);

    await waitFor(() => expect(adminService.list).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ page: 1 })));
  });
});

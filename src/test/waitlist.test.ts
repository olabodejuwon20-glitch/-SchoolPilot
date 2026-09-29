import { describe, it, expect, vi } from "vitest";
import { normalizeEmail, exportLeadsToCsv } from "@/lib/waitlistService";
import type { WaitlistLead } from "@/types/waitlist";

describe("Waitlist Service Logic", () => {
  it("normalizes email to lowercase and trimmed string", () => {
    expect(normalizeEmail("  Adaobi@School.Edu.NG  ")).toBe("adaobi@school.edu.ng");
    expect(normalizeEmail("TEST.USER@GMAIL.COM")).toBe("test.user@gmail.com");
    expect(normalizeEmail("principal@oakland.ng")).toBe("principal@oakland.ng");
  });

  it("handles CSV export without throwing errors", () => {
    const mockLeads: WaitlistLead[] = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "Mrs. Adaobi Nwosu",
        email: "adaobi@greenfield.ng",
        phone: "+2348031234567",
        role: "Principal",
        school_name: "Greenfield College",
        city: "Ikeja",
        state: "Lagos",
        country: "Nigeria",
        interests: ["School management", "Digital examinations"],
        status: "new",
        notes: "Interested in early pilot",
        source: "tiktok",
        created_at: "2026-09-04T10:00:00Z",
        updated_at: "2026-09-04T10:00:00Z",
      },
    ];

    // Mock URL and click in jsdom
    const createObjectURLMock = vi.fn(() => "blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(() => exportLeadsToCsv(mockLeads, "test.csv")).not.toThrow();

    clickSpy.mockRestore();
  });
});

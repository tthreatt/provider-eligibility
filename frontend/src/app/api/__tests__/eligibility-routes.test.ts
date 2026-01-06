/**
 * Tests for Next.js API routes
 * Note: These tests mock the Clerk auth and backend API calls
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// Mock Clerk auth
const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKEND_URL = "http://localhost:8000";
    process.env.API_KEY = "test-api-key";
  });

  describe("GET /api/eligibility/rules", () => {
    it("should return eligibility rules when authenticated", async () => {
      // Mock auth to return a user
      mockAuth.mockResolvedValue({ userId: "user123" });

      // Mock backend response
      const mockRules = [
        {
          id: 1,
          code: "md",
          name: "Allopathic & Osteopathic Physicians",
          requirements: [
            {
              id: 1,
              requirement_type: "license",
              name: "State License",
              is_required: true,
              validation_rules: {},
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => mockRules,
        text: async () => JSON.stringify(mockRules),
      });

      // Import the route handler dynamically
      const { GET } = await import("../eligibility/rules/route");

      const request = new NextRequest(
        "http://localhost:3000/api/eligibility/rules"
      );
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRules);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/eligibility/rules",
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { GET } = await import("../eligibility/rules/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle backend errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user123" });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Backend error" }),
        text: async () => JSON.stringify({ error: "Backend error" }),
      });

      const { GET } = await import("../eligibility/rules/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/eligibility/check", () => {
    it("should check eligibility when authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: "user123" });

      const mockProviderData = {
        "NPI Validation": {
          providerName: "Test Provider",
          npi: "1104025329",
          providerType: "Allopathic & Osteopathic Physicians",
        },
        Licenses: [
          {
            category: "state_license",
            status: "Active",
            expirationDate: "2026-12-31",
          },
        ],
      };

      const mockRules = [
        {
          id: 1,
          code: "md",
          name: "Allopathic & Osteopathic Physicians",
          requirements: [
            {
              requirement_type: "license",
              name: "State License",
              is_required: true,
              validation_rules: {},
            },
          ],
        },
      ];

      // Mock provider profile fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => mockProviderData,
          text: async () => JSON.stringify(mockProviderData),
        })
        // Mock rules fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => mockRules,
          text: async () => JSON.stringify(mockRules),
        });

      const { POST } = await import("../eligibility/check/route");

      const request = new NextRequest(
        "http://localhost:3000/api/eligibility/check",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isEligible).toBeDefined();
      expect(data.rawApiResponse).toBeDefined();
    });

    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { POST } = await import("../eligibility/check/route");

      const request = new NextRequest(
        "http://localhost:3000/api/eligibility/check",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle provider profile fetch errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user123" });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Provider not found" }),
        text: async () => JSON.stringify({ error: "Provider not found" }),
      });

      const { POST } = await import("../eligibility/check/route");

      const request = new NextRequest(
        "http://localhost:3000/api/eligibility/check",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/fetch-provider-data", () => {
    it("should fetch provider data when authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: "user123" });

      const mockProviderData = {
        isEligible: true,
        requirements: {
          stateLicense: true,
          deaCds: true,
          boardCertification: true,
          providerType: "Allopathic & Osteopathic Physicians",
        },
        rawApiResponse: {
          "NPI Validation": {
            providerName: "Test Provider",
            npi: "1104025329",
            updateDate: "2025-01-01",
            licenses: [
              {
                code: "2084N0402X - Allopathic & Osteopathic Physicians",
              },
            ],
          },
          Licenses: [
            {
              category: "state_license",
              status: "Active",
              expirationDate: "2026-12-31",
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
          entries: () => [["content-type", "application/json"]],
        },
        json: async () => mockProviderData,
        text: async () => JSON.stringify(mockProviderData),
      });

      const { POST } = await import("../fetch-provider-data/route");

      const request = new NextRequest(
        "http://localhost:3000/api/fetch-provider-data",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/fetch-provider-data",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-KEY": "test-api-key",
          }),
          body: JSON.stringify({ npi: "1104025329" }),
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { POST } = await import("../fetch-provider-data/route");

      const request = new NextRequest(
        "http://localhost:3000/api/fetch-provider-data",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle backend errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user123" });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Backend error" }),
        text: async () => JSON.stringify({ error: "Backend error" }),
      });

      const { POST } = await import("../fetch-provider-data/route");

      const request = new NextRequest(
        "http://localhost:3000/api/fetch-provider-data",
        {
          method: "POST",
          body: JSON.stringify({ npi: "1104025329" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

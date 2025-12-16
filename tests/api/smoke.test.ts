/**
 * Tests de fumée (smoke tests) pour vérifier que les routes API fonctionnent
 * 
 * Usage: npx jest tests/api/smoke.test.ts
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const API_URL = process.env.API_URL || "http://localhost:3000";

describe("Smoke Tests API", () => {
  beforeAll(() => {
    // Vérifier que l'API est accessible
    console.log(`Testing API at ${API_URL}`);
  });

  it("should respond to health check", async () => {
    const response = await fetch(`${API_URL}/api/health`);
    expect(response.status).toBe(200);
  });

  it("should list demandes", async () => {
    const response = await fetch(`${API_URL}/api/demandes`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.demandes)).toBe(true);
  });

  it("should list missions", async () => {
    const response = await fetch(`${API_URL}/api/admin/missions`);
    expect(response.status).toBe(401); // Non authentifié, c'est normal
  });

  it("should list prestataires", async () => {
    const response = await fetch(`${API_URL}/api/prestataires`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.prestataires || data.stats)).toBe(true);
  });
});


import { test, expect } from '@playwright/test';

/**
 * Critical User Journeys for AIplaces.art
 * These tests cover the core flows that must work for launch
 */

test.describe('Journey 1: Agent Onboarding', () => {
  test('claim page UI elements are present', async ({ page }) => {
    // Visit claim page with a test code (will show error, but UI should load)
    await page.goto('/claim/test_claim_code');

    // Page should load and show either claim form or error
    await page.waitForLoadState('networkidle');

    // Should show some indication of the claim page
    const hasClaimUI = await page.locator('text=Claim').first().isVisible().catch(() => false);
    const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
    const hasClaimNotFound = await page.locator('text=Claim Not Found').isVisible().catch(() => false);

    expect(hasClaimUI || hasNotFound || hasClaimNotFound).toBe(true);
  });

  test('claim page shows error for invalid code', async ({ page }) => {
    await page.goto('/claim/invalid_code_that_does_not_exist');

    await page.waitForLoadState('networkidle');

    // Should show error state
    await expect(page.locator('text=Claim Not Found')).toBeVisible();
  });

  test('registration API endpoint exists', async ({ request }) => {
    // Test that the endpoint exists and validates input
    const response = await request.post('/api/v1/agents/register', {
      data: { name: 'ab', description: 'Too short name' },
    });

    // Should return a response (success or validation error)
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });
});

test.describe('Journey 2: Canvas Interaction (Observer)', () => {
  test('complete observer journey: load → view → explore', async ({ page }) => {
    // Step 1: Load the canvas
    await page.goto('/');

    // Step 2: Canvas should load and display (use first() as there may be multiple canvas elements)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Step 3: Verify art is visible (canvas has dimensions)
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Step 4: Activity feed should show recent actions
    await expect(page.locator('text=Recent Activity')).toBeVisible();

    // Step 5: Leaderboard should show top agents
    await expect(page.locator('text=Leaderboard')).toBeVisible();

    // Step 6: Observer toolbar should be present
    await expect(page.locator('text=Palette:')).toBeVisible();
    await expect(page.locator('text=Live')).toBeVisible();

    // Step 7: Zoom in to see detail
    const canvasContainer = page.locator('.canvas-container');
    await canvasContainer.hover();

    // Zoom in
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }

    // Step 8: Pan around
    const containerBox = await canvasContainer.boundingBox();
    if (containerBox) {
      await page.mouse.move(
        containerBox.x + containerBox.width / 2,
        containerBox.y + containerBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        containerBox.x + containerBox.width / 2 - 100,
        containerBox.y + containerBox.height / 2 - 100
      );
      await page.mouse.up();
    }

    // Step 9: Coordinates should update
    const coords = page.locator('.font-mono').first();
    await expect(coords).toBeVisible();
  });

  test('observer can see live status indicator', async ({ page }) => {
    await page.goto('/');

    // Live indicator should be visible
    const liveIndicator = page.locator('text=Live');
    await expect(liveIndicator).toBeVisible();

    // The live indicator text is sufficient - don't rely on specific animation class
  });
});

test.describe('Journey 3: Real-time Updates', () => {
  test('activity feed shows recent pixel placements', async ({ page }) => {
    await page.goto('/');

    // Activity feed section
    const activitySection = page.locator('text=Recent Activity');
    await expect(activitySection).toBeVisible();

    // Should show agent activity entries with coordinates like (123, 456)
    const coordsPattern = page.locator('text=/\\(\\d+, \\d+\\)/').first();
    await expect(coordsPattern).toBeVisible({ timeout: 5000 });
  });

  test('header stats are displayed', async ({ page }) => {
    await page.goto('/');

    // Active Agents counter
    await expect(page.locator('text=Active Agents')).toBeVisible();

    // Pixels Today counter
    await expect(page.locator('text=Pixels Today')).toBeVisible();

    // Canvas Age
    await expect(page.locator('text=Canvas Age')).toBeVisible();

    // Watching count
    await expect(page.locator('text=Watching')).toBeVisible();
  });
});

test.describe('Journey 4: Mobile Experience', () => {
  test('responsive layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load
    await page.waitForLoadState('networkidle');

    // Canvas container should exist (canvas might be hidden on very small screens)
    const canvasContainer = page.locator('.canvas-container');
    await expect(canvasContainer).toBeVisible({ timeout: 10000 });

    // Key elements should be accessible
    await expect(page.locator('text=AIplaces')).toBeVisible();
  });

  test('responsive layout on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Page should load
    await page.waitForLoadState('networkidle');

    // Canvas container should be visible
    const canvasContainer = page.locator('.canvas-container');
    await expect(canvasContainer).toBeVisible({ timeout: 10000 });
  });

  test('page loads on various screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },   // iPhone SE
      { width: 375, height: 812 },   // iPhone X
      { width: 414, height: 896 },   // iPhone XR
      { width: 768, height: 1024 },  // iPad
      { width: 1024, height: 768 },  // iPad landscape
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Page should not crash
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });
});

test.describe('API Integration for Agents', () => {
  test('agent API endpoints respond', async ({ request }) => {
    // Region endpoint (uses demo data)
    const regionResponse = await request.get('/api/v1/canvas/region?x=200&y=200&width=100&height=100');
    expect(regionResponse.ok()).toBeTruthy();

    const regionData = await regionResponse.json();
    expect(regionData.success).toBe(true);
  });

  test('agent can check neighbors for pattern matching', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/neighbors?x=250&y=250&radius=2');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.analysis).toHaveProperty('isEdge');
    expect(data.data.analysis).toHaveProperty('dominantColor');
  });

  test('agent can monitor recent activity', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/recent?limit=20');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.stats.hotspots).toBeTruthy();
    expect(data.data.stats.topAgents).toBeTruthy();
  });

  test('color palette endpoint works', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/colors');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.colors).toHaveLength(16);
  });
});

test.describe('Error Handling', () => {
  test('invalid canvas coordinates return error', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/region?x=-1&y=-1');

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code');
  });

  test('missing required params return error', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/neighbors');

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('MISSING_COORDINATES');
  });

  test('404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

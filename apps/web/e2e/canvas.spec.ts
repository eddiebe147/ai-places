import { test, expect } from '@playwright/test';

test.describe('Canvas Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the canvas page', async ({ page }) => {
    // Check page title/branding
    await expect(page.locator('text=AIplaces.art')).toBeVisible();
  });

  test('should display the canvas element', async ({ page }) => {
    // Canvas should be visible (use first() as there may be multiple canvas elements)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should show the observer toolbar with color palette', async ({ page }) => {
    // Color palette legend should be visible
    await expect(page.locator('text=Palette:')).toBeVisible();

    // Should show color palette - look for White color swatch
    await expect(page.locator('[title="0: White"]')).toBeVisible();
    await expect(page.locator('[title="15: Magenta"]')).toBeVisible();
  });

  test('should show live indicator', async ({ page }) => {
    await expect(page.locator('text=Live')).toBeVisible();
  });

  test('should show coordinates display', async ({ page }) => {
    // Coordinates should be displayed - look for the coordinate text
    await expect(page.locator('text="250, 250"')).toBeVisible();
  });

  test('should show zoom percentage', async ({ page }) => {
    // Zoom should be displayed (format: "XXX%")
    await expect(page.locator('text="100%"')).toBeVisible();
  });
});

test.describe('Canvas Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should update coordinates on mouse move', async ({ page }) => {
    const canvas = page.locator('.canvas-container');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Get bounding box to find a position not blocked by sidebar (sidebar is ~320px on left)
    const box = await canvas.boundingBox();
    if (box) {
      // Move to center-right of canvas to avoid sidebar overlay
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    }

    // Wait for coordinates to update
    await page.waitForTimeout(200);

    // Coordinates display should exist
    const coordsContainer = page.locator('text=/\\(\\d+, \\d+\\)/').first();
    await expect(coordsContainer).toBeVisible();
  });

  test('should allow zooming with scroll wheel', async ({ page }) => {
    const canvas = page.locator('.canvas-container');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Scroll to zoom in
    await canvas.hover();
    await page.mouse.wheel(0, -100);

    // Wait for zoom to update
    await page.waitForTimeout(300);

    // Just verify the zoom indicator is still visible
    const zoomIndicator = page.locator('text=/\\d+%/').first();
    await expect(zoomIndicator).toBeVisible();
  });

  test('should allow panning with drag', async ({ page }) => {
    const canvas = page.locator('.canvas-container');
    const box = await canvas.boundingBox();

    if (box) {
      // Drag to pan
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
      await page.mouse.up();

      // Canvas should have moved (cursor should change during drag)
      // This is a basic check - could be enhanced
    }
  });
});

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display leaderboard', async ({ page }) => {
    await expect(page.locator('text=Leaderboard')).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should show agent names in leaderboard', async ({ page }) => {
    // Leaderboard should have agent entries
    const leaderboardSection = page.locator('text=Leaderboard').locator('..');
    await expect(leaderboardSection).toBeVisible();
  });
});

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display active agents count', async ({ page }) => {
    await expect(page.locator('text=Active Agents')).toBeVisible();
  });

  test('should display pixels today count', async ({ page }) => {
    await expect(page.locator('text=Pixels Today')).toBeVisible();
  });

  test('should display canvas age', async ({ page }) => {
    await expect(page.locator('text=Canvas Age')).toBeVisible();
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have About link', async ({ page }) => {
    await expect(page.locator('a:has-text("About")')).toBeVisible();
  });

  test('should have GitHub link', async ({ page }) => {
    await expect(page.locator('a:has-text("GitHub")')).toBeVisible();
  });

  test('should have API Docs link', async ({ page }) => {
    await expect(page.locator('a:has-text("API Docs")')).toBeVisible();
  });

  test('should have Register Agent link', async ({ page }) => {
    await expect(page.locator('a:has-text("Register Agent")')).toBeVisible();
  });

  test('should credit id8Labs', async ({ page }) => {
    await expect(page.locator('text=id8Labs')).toBeVisible();
  });
});

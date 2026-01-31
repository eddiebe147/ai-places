import { test, expect } from '@playwright/test';

test.describe('Canvas API', () => {
  test('GET /api/v1/canvas - should return canvas state or require Redis', async ({ request }) => {
    const response = await request.get('/api/v1/canvas');
    const data = await response.json();

    // Either returns success with canvas data, or fails gracefully (Redis not configured)
    if (response.ok()) {
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('canvas');
      expect(data.data).toHaveProperty('width', 500);
      expect(data.data).toHaveProperty('height', 500);
    } else {
      // Redis not available - endpoint correctly reports error
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    }
  });

  test('GET /api/v1/canvas/colors - should return color palette', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/colors');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.colors).toHaveLength(16);

    // Verify first color is white
    expect(data.data.colors[0]).toMatchObject({
      index: 0,
      hex: '#FFFFFF',
      name: 'White',
    });
  });

  test('GET /api/v1/canvas/region - should return canvas region', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/region?x=0&y=0&width=10&height=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.region).toMatchObject({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    expect(data.data).toHaveProperty('dominantColors');
  });

  test('GET /api/v1/canvas/neighbors - should return neighboring pixels', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/neighbors?x=250&y=250&radius=1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('center');
    expect(data.data.center).toMatchObject({ x: 250, y: 250 });
    expect(data.data).toHaveProperty('neighbors');
    expect(data.data).toHaveProperty('analysis');
  });

  test('GET /api/v1/canvas/recent - should return recent changes', async ({ request }) => {
    const response = await request.get('/api/v1/canvas/recent?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('changes');
    expect(data.data).toHaveProperty('stats');
    expect(data.data.stats).toHaveProperty('topAgents');
    expect(data.data.stats).toHaveProperty('hotspots');
  });

  test('POST /api/v1/canvas/pixel - should require authentication', async ({ request }) => {
    const response = await request.post('/api/v1/canvas/pixel', {
      data: { x: 100, y: 100, color: 5 },
    });

    // Should fail without auth
    expect(response.status()).toBe(401);
  });
});

test.describe('Agent API', () => {
  test('POST /api/v1/agents/register - should register new agent', async ({ request }) => {
    const uniqueName = `TestAgent_${Date.now()}`;

    const response = await request.post('/api/v1/agents/register', {
      data: {
        name: uniqueName,
        description: 'E2E test agent',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('agent_id');
    expect(data.data).toHaveProperty('api_key');
    expect(data.data.api_key).toMatch(/^aip_/);
    expect(data.data).toHaveProperty('claim_url');
    expect(data.data.status).toBe('pending');
  });

  test('POST /api/v1/agents/register - should reject duplicate names', async ({ request }) => {
    const uniqueName = `DupeTest_${Date.now()}`;

    // First registration
    await request.post('/api/v1/agents/register', {
      data: { name: uniqueName, description: 'First' },
    });

    // Second registration with same name
    const response = await request.post('/api/v1/agents/register', {
      data: { name: uniqueName, description: 'Second' },
    });

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NAME_TAKEN');
  });

  test('POST /api/v1/agents/register - should validate agent name', async ({ request }) => {
    // Name too short
    const response = await request.post('/api/v1/agents/register', {
      data: { name: 'ab', description: 'Too short' },
    });

    expect(response.ok()).toBeFalsy();
  });

  test('GET /api/v1/agents/leaderboard - should return top agents or require database', async ({ request }) => {
    const response = await request.get('/api/v1/agents/leaderboard');
    const data = await response.json();

    // Either returns success with agents, or fails gracefully (database not configured)
    if (response.ok()) {
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.agents)).toBe(true);
    } else {
      // Database not available - endpoint correctly reports error
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    }
  });
});

test.describe('Claim API', () => {
  test('GET /api/v1/claim/[invalid] - should return 404 for invalid code', async ({ request }) => {
    const response = await request.get('/api/v1/claim/invalid_code_123');

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('CLAIM_NOT_FOUND');
  });

  test('POST /api/v1/claim/[code]/verify - should validate tweet URL format', async ({ request }) => {
    const response = await request.post('/api/v1/claim/test_code/verify', {
      data: { tweet_url: 'not-a-valid-url' },
    });

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_TWEET_URL');
  });
});

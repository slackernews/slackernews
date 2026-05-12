import { test, expect } from '@playwright/test';

const baseUrl = process.env.TEST_URL;

// Helper to create an API token for testing
async function getTestToken(request: any): Promise<string | null> {
  // First, we need to authenticate via the web UI to get a session
  // For testing purposes, we'll use a direct database approach or mock
  // This is a placeholder - in a real test environment, you'd set up auth
  return null;
}

test.describe('CLI API Routes', () => {
  test('GET /api/v1/cli/links returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/v1/cli/links`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('GET /api/v1/cli/links/search returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/v1/cli/links/search?q=test`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('POST /api/v1/cli/links/[id]/comments returns 401 without auth', async ({ request }) => {
    const encodedLink = encodeURIComponent('https://docs.slackernews.io');
    const response = await request.post(`${baseUrl}/api/v1/cli/links/${encodedLink}/comments`, {
      data: { body: 'Test comment' },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('GET /api/v1/cli/links returns 405 for POST', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/cli/links`);
    expect(response.status()).toBe(405);
  });

  test('GET /api/v1/cli/links/search returns 405 for POST', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/cli/links/search`);
    expect(response.status()).toBe(405);
  });
});

import { test, expect } from '@playwright/test';

const baseUrl = process.env.TEST_URL;

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

  test('POST /api/v1/cli/links/[id]/comments returns 405 for GET', async ({ request }) => {
    const encodedLink = encodeURIComponent('https://docs.slackernews.io');
    const response = await request.get(`${baseUrl}/api/v1/cli/links/${encodedLink}/comments`);
    expect(response.status()).toBe(405);
  });

  test('POST /api/v1/cli/links/[id]/comments returns 400 for invalid URL encoding', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/cli/links/%ZZ/comments`, {
      data: { body: 'Test comment' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid link ID encoding');
  });

  test('POST /api/v1/cli/links/[id]/comments returns 400 for missing body', async ({ request }) => {
    const encodedLink = encodeURIComponent('https://docs.slackernews.io');
    const response = await request.post(`${baseUrl}/api/v1/cli/links/${encodedLink}/comments`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/v1/cli/links/[id]/comments returns 400 for empty body', async ({ request }) => {
    const encodedLink = encodeURIComponent('https://docs.slackernews.io');
    const response = await request.post(`${baseUrl}/api/v1/cli/links/${encodedLink}/comments`, {
      data: { body: '' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/v1/cli/links/[id]/comments returns 400 for body exceeding max length', async ({ request }) => {
    const encodedLink = encodeURIComponent('https://docs.slackernews.io');
    const response = await request.post(`${baseUrl}/api/v1/cli/links/${encodedLink}/comments`, {
      data: { body: 'x'.repeat(2001) },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/user/tokens returns 401 without auth', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/user/tokens`, {
      data: { name: 'Test Token' },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /api/user/tokens returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/user/tokens`);
    expect(response.status()).toBe(401);
  });
});

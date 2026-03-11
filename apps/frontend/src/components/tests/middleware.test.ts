/** @jest-environment node */

import { getToken } from 'next-auth/jwt';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('report-generator middleware', () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
  });

  test('redirects unauthenticated requests to sign-in with callback', async () => {
    const { middleware } = await import('../../middleware');
    mockedGetToken.mockResolvedValue(null);

    const response = await middleware({
      url: 'http://localhost:3000/report-generator/123',
    } as never);

    expect(response.headers.get('location')).toContain('/api/auth/signin');
    expect(response.headers.get('location')).toContain('callbackUrl=');
  });

  test('redirects authenticated users without inspector roles to home', async () => {
    const { middleware } = await import('../../middleware');
    mockedGetToken.mockResolvedValue({ role: 'customer' } as never);

    const response = await middleware({
      url: 'http://localhost:3000/report-generator/123',
    } as never);

    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  test('allows employee/admin roles through', async () => {
    const { middleware } = await import('../../middleware');
    mockedGetToken.mockResolvedValue({ role: 'employee' } as never);

    const response = await middleware({
      url: 'http://localhost:3000/report-generator/123',
    } as never);

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});

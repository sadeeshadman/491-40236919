jest.mock('../../auth', () => ({
  authOptions: { marker: 'auth-options' },
}));

const nextAuthMock = jest.fn(() => 'route-handler');

jest.mock('next-auth', () => ({
  __esModule: true,
  default: nextAuthMock,
}));

describe('NextAuth route', () => {
  test('initializes NextAuth with authOptions and exports same handler for GET/POST', async () => {
    const routeModule = await import('../../app/api/auth/[...nextauth]/route');

    expect(nextAuthMock).toHaveBeenCalledWith({ marker: 'auth-options' });
    expect(routeModule.GET).toBe('route-handler');
    expect(routeModule.POST).toBe('route-handler');
  });
});

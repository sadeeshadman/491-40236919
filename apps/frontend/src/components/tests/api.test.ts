describe('api helper', () => {
  async function loadApiModule() {
    jest.resetModules();
    return import('../../lib/api');
  }

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as { fetch?: unknown }).fetch;
  });

  test('returns normalized relative URL in browser context', async () => {
    const { getApiUrl } = await loadApiModule();

    expect(getApiUrl('/quotes')).toBe('/api/quotes');
    expect(getApiUrl('quotes')).toBe('/api/quotes');
    expect(getApiUrl('/api/quotes')).toBe('/api/quotes');
  });

  test('keeps /api root path unchanged', async () => {
    const { getApiUrl } = await loadApiModule();

    expect(getApiUrl('/api')).toBe('/api');
  });

  test('returns JSON payload on successful request', async () => {
    const { apiFetch } = await loadApiModule();

    const responsePayload = { quotes: [] };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
    });
    (global as { fetch?: unknown }).fetch = fetchMock;

    const result = await apiFetch<typeof responsePayload>('/quotes');

    expect(fetchMock).toHaveBeenCalledWith('/api/quotes', undefined);
    expect(result).toEqual(responsePayload);
  });

  test('throws API error from JSON response when request fails', async () => {
    const { apiFetch } = await loadApiModule();

    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Missing fields' }),
    });

    await expect(apiFetch('/quotes')).rejects.toThrow('Missing fields');
  });

  test('falls back to default error message when response JSON is invalid', async () => {
    const { apiFetch } = await loadApiModule();

    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json');
      },
    });

    await expect(apiFetch('/quotes')).rejects.toThrow('API request failed: 500');
  });
});

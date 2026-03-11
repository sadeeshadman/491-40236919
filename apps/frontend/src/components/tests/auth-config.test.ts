import bcrypt from 'bcryptjs';
import { authOptions } from '../../auth';
import { findUserByEmail } from '../../lib/auth/user-repository';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../../lib/auth/user-repository', () => ({
  findUserByEmail: jest.fn(),
}));

const mockedCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockedFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>;

describe('authOptions', () => {
  beforeEach(() => {
    mockedCompare.mockReset();
    mockedFindUserByEmail.mockReset();
  });

  test('authorize returns null when credentials are missing', async () => {
    const provider = authOptions.providers[0] as unknown as {
      options: {
        authorize: (
          credentials?: Record<string, unknown>,
          req?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
      authorize: (
        credentials?: Record<string, unknown>,
        req?: Record<string, unknown>,
      ) => Promise<unknown>;
    };

    const result = await provider.options.authorize({ email: '', password: '' }, {});
    expect(result).toBeNull();
    expect(mockedFindUserByEmail).not.toHaveBeenCalled();
  });

  test('authorize returns null for invalid role or password mismatch', async () => {
    const provider = authOptions.providers[0] as unknown as {
      options: {
        authorize: (
          credentials?: Record<string, unknown>,
          req?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
      authorize: (
        credentials?: Record<string, unknown>,
        req?: Record<string, unknown>,
      ) => Promise<unknown>;
    };

    mockedFindUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'inspector@example.com',
      name: 'Inspector',
      role: 'viewer',
      passwordHash: 'hash',
    });

    const invalidRoleResult = await provider.options.authorize(
      { email: 'inspector@example.com', password: 'pw' },
      {},
    );
    expect(invalidRoleResult).toBeNull();

    mockedFindUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'inspector@example.com',
      name: 'Inspector',
      role: 'employee',
      passwordHash: 'hash',
    });
    (mockedCompare as unknown as jest.Mock).mockResolvedValue(false);

    const invalidPasswordResult = await provider.options.authorize(
      { email: 'inspector@example.com', password: 'pw' },
      {},
    );
    expect(invalidPasswordResult).toBeNull();
  });

  test('authorize returns authenticated user for valid credentials', async () => {
    const provider = authOptions.providers[0] as unknown as {
      options: {
        authorize: (
          credentials?: Record<string, unknown>,
          req?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
      authorize: (
        credentials?: Record<string, unknown>,
        req?: Record<string, unknown>,
      ) => Promise<unknown>;
    };

    mockedFindUserByEmail.mockResolvedValue({
      id: 'u2',
      email: 'inspector@example.com',
      name: null,
      role: 'admin',
      passwordHash: 'hash',
    });
    (mockedCompare as unknown as jest.Mock).mockResolvedValue(true);

    const successResult = await provider.options.authorize(
      { email: '  INSPECTOR@example.com ', password: 'pw' },
      {},
    );
    expect(successResult).toEqual({
      id: 'u2',
      name: 'inspector@example.com',
      email: 'inspector@example.com',
      role: 'admin',
    });

    expect(mockedFindUserByEmail).toHaveBeenCalledWith('INSPECTOR@example.com');
  });

  test('jwt callback stores role and session callback maps role/id', async () => {
    const jwt = authOptions.callbacks?.jwt as unknown as (params: Record<string, unknown>) =>
      Promise<Record<string, unknown>>;
    const session = authOptions.callbacks?.session as unknown as (params: Record<string, unknown>) =>
      Promise<Record<string, unknown>>;

    if (!jwt || !session) {
      throw new Error('Expected auth callbacks to be defined');
    }

    await expect(
      jwt({ token: { sub: '1' }, user: { role: 'admin' }, account: null }),
    ).resolves.toEqual({ sub: '1', role: 'admin' });

    await expect(
      session({
        session: { user: { name: 'x' } },
        token: { sub: 'abc', role: 'admin' },
        user: {},
      }),
    ).resolves.toEqual({ user: { name: 'x', id: 'abc', role: 'admin' } });

    await expect(
      session({
        session: { user: { name: 'x' } },
        token: { sub: undefined, role: 'employee' },
        user: {},
      }),
    ).resolves.toEqual({ user: { name: 'x', id: '', role: 'employee' } });
  });
});

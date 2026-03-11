jest.mock('../../lib/db/mongodb', () => ({
  getMongoDb: jest.fn(),
}));

import { findUserByEmail } from '../../lib/auth/user-repository';
import { getMongoDb } from '../../lib/db/mongodb';

const mockedGetMongoDb = getMongoDb as jest.MockedFunction<typeof getMongoDb>;

describe('findUserByEmail', () => {
  beforeEach(() => {
    mockedGetMongoDb.mockReset();
  });

  test('returns null for blank email input', async () => {
    await expect(findUserByEmail('   ')).resolves.toBeNull();
    expect(mockedGetMongoDb).not.toHaveBeenCalled();
  });

  test('returns normalized auth user from exact email match', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValueOnce({
        _id: { toHexString: () => '65f1d4c5b2b5c0d6d4f9a100' },
        email: 'Inspector@Example.com',
        name: 'Inspector',
        role: 'employee',
        passwordHash: 'hash-1',
      })
      .mockResolvedValueOnce(null);

    mockedGetMongoDb.mockResolvedValue({
      collection: () => ({ findOne }),
    } as never);

    await expect(findUserByEmail(' INSPECTOR@example.com ')).resolves.toEqual({
      id: '65f1d4c5b2b5c0d6d4f9a100',
      email: 'inspector@example.com',
      name: 'Inspector',
      role: 'employee',
      passwordHash: 'hash-1',
    });

    expect(findOne).toHaveBeenCalledWith({ email: 'inspector@example.com' });
  });

  test('falls back to case-insensitive lookup and legacy password fields', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: { toHexString: () => '65f1d4c5b2b5c0d6d4f9a101' },
        email: 'User@Example.com',
        name: undefined,
        role: undefined,
        hashedPassword: 'legacy-hash',
      });

    mockedGetMongoDb.mockResolvedValue({
      collection: () => ({ findOne }),
    } as never);

    await expect(findUserByEmail('user@example.com')).resolves.toEqual({
      id: '65f1d4c5b2b5c0d6d4f9a101',
      email: 'user@example.com',
      name: null,
      role: null,
      passwordHash: 'legacy-hash',
    });

    expect(findOne.mock.calls[1][0].email).toBeInstanceOf(RegExp);
  });

  test('returns null when document has no usable email', async () => {
    const findOne = jest.fn().mockResolvedValueOnce({
      _id: { toHexString: () => '65f1d4c5b2b5c0d6d4f9a102' },
      role: 'employee',
      password: 'legacy-password',
    });

    mockedGetMongoDb.mockResolvedValue({
      collection: () => ({ findOne }),
    } as never);

    await expect(findUserByEmail('test@example.com')).resolves.toBeNull();
  });
});

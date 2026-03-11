describe('frontend mongodb helper', () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as { _frontendMongoClientPromise?: Promise<unknown> })
      ._frontendMongoClientPromise;
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB_NAME;
  });

  test('throws when MONGODB_URI is missing', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    jest.doMock('mongodb', () => ({
      MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
      })),
    }));

    const { getMongoDb } = await import('../../lib/db/mongodb');

    await expect(getMongoDb()).rejects.toThrow(
      'MONGODB_URI must be set for frontend authentication.',
    );
  });

  test('reuses cached client promise in development and defaults db name', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });
    process.env.MONGODB_URI = 'mongodb://example';

    const dbMock = jest.fn((dbName: string) => ({ dbName }));
    const connectMock = jest.fn(async () => ({ db: dbMock }));

    jest.doMock('mongodb', () => ({
      MongoClient: jest.fn().mockImplementation(() => ({
        connect: connectMock,
      })),
    }));

    const { getMongoDb } = await import('../../lib/db/mongodb');

    await expect(getMongoDb()).resolves.toEqual({ dbName: 'constein' });
    await expect(getMongoDb()).resolves.toEqual({ dbName: 'constein' });

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(dbMock).toHaveBeenCalledWith('constein');
  });

  test('uses configured db name and new client in production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    process.env.MONGODB_URI = 'mongodb://example';
    process.env.MONGODB_DB_NAME = 'custom-db';

    const dbMock = jest.fn((dbName: string) => ({ dbName }));
    const connectMock = jest.fn(async () => ({ db: dbMock }));

    jest.doMock('mongodb', () => ({
      MongoClient: jest.fn().mockImplementation(() => ({
        connect: connectMock,
      })),
    }));

    const { getMongoDb } = await import('../../lib/db/mongodb');

    await expect(getMongoDb()).resolves.toEqual({ dbName: 'custom-db' });
    await expect(getMongoDb()).resolves.toEqual({ dbName: 'custom-db' });

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(dbMock).toHaveBeenCalledWith('custom-db');
  });
});

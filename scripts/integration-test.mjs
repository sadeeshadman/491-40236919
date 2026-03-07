import { spawn } from 'node:child_process';

const integrationPort =
  process.env.INTEGRATION_BACKEND_PORT ?? String(4300 + Math.floor(Math.random() * 200));
const baseUrl = process.env.INTEGRATION_BASE_URL ?? `http://127.0.0.1:${integrationPort}`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForBackendReady() {
  const attempts = 40;

  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health/db`);

      if (response.ok) {
        return;
      }
    } catch {
      // Keep retrying until timeout.
    }

    await sleep(1000);
  }

  throw new Error(`Backend did not become ready at ${baseUrl}`);
}

async function runIntegrationAssertions() {
  const uniqueToken = Date.now().toString(36);
  const email = `integration-${uniqueToken}@example.com`;

  const createPayload = {
    name: 'Integration Test User',
    email,
    phone: '6135550150',
    typeOfService: 'Property Management',
    specification: 'Tenant Screening',
    requestDetails: 'Integration test: verify quote API create/list behavior.',
    preferredContactMethod: 'email',
    propertyLocation: 'Ottawa, Ontario',
    sourcePage: '/property-management',
  };

  const createResponse = await fetch(`${baseUrl}/api/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  const createBody = await createResponse.json();
  assert(
    createResponse.status === 201,
    `Expected 201 from POST /api/quotes, got ${createResponse.status}`,
  );
  assert(Boolean(createBody.quote?._id), 'Created quote is missing _id');
  assert(
    typeof createBody.email?.sent === 'boolean',
    'Expected email.sent boolean in quote create response',
  );

  const listResponse = await fetch(`${baseUrl}/api/quotes`);
  const listBody = await listResponse.json();
  assert(
    listResponse.status === 200,
    `Expected 200 from GET /api/quotes, got ${listResponse.status}`,
  );
  assert(Array.isArray(listBody.quotes), 'Expected quotes array in GET /api/quotes response');

  const createdQuoteId = createBody.quote._id;
  const quotePresent = listBody.quotes.some((quote) => quote?._id === createdQuoteId);
  assert(quotePresent, `Created quote ${createdQuoteId} not found in GET /api/quotes results`);

  console.log(`Integration test passed. Created quote ${createdQuoteId}`);
}

async function main() {
  const backendProcess = spawn(npmCommand, ['run', 'start', '--workspace', 'backend'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: integrationPort,
    },
  });

  const exitPromise = new Promise((resolve, reject) => {
    backendProcess.on('error', reject);
    backendProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`Backend process exited early with code ${code}`));
      } else {
        resolve();
      }
    });
  });

  try {
    await Promise.race([waitForBackendReady(), exitPromise]);
    await runIntegrationAssertions();
  } finally {
    if (!backendProcess.killed) {
      backendProcess.kill('SIGTERM');
      await sleep(500);

      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Integration test failed: ${message}`);
  process.exit(1);
}

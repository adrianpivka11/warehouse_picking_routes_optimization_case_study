import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/server.js';

/** Checks that an HTTP request receives the computed route. */
test('POST /optimize loads positions and returns the shortest route', async (context) => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.WAREHOUSE_API_KEY;
  const previousUrl = process.env.WAREHOUSE_API_BASE_URL;
  process.env.WAREHOUSE_API_KEY = 'test-key';
  process.env.WAREHOUSE_API_BASE_URL = 'https://warehouse.test';
  context.after(() => {
    if (previousKey === undefined) delete process.env.WAREHOUSE_API_KEY;
    else process.env.WAREHOUSE_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.WAREHOUSE_API_BASE_URL;
    else process.env.WAREHOUSE_API_BASE_URL = previousUrl;
  });
  context.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (String(input).startsWith('https://warehouse.test/')) {
      if (String(input).includes('/product-999999999/')) {
        return new Response('[]', { status: 200 });
      }
      return new Response(JSON.stringify([{
        positionId: 'position-31', x: 3, y: 1, z: 0, productId: 'product-1', quantity: 13,
      }]));
    }
    return originalFetch(input, init);
  });
  const server = createApp().listen(0);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('The test server did not receive a TCP port.');
    }

    const response = await fetch(`http://localhost:${address.port}/optimize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        products: ['product-1'],
        startingPosition: { x: 0, y: 0, z: 0 },
      }),
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
    assert.deepEqual(await response.json(), {
      distance: Math.sqrt(10),
      pickingOrder: [{ productId: 'product-1', positionId: 'position-31' }],
    });

    const unavailableResponse = await fetch(`http://localhost:${address.port}/optimize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        products: ['product-999999999'],
        startingPosition: { x: 0, y: 0, z: 0 },
      }),
    });
    assert.equal(unavailableResponse.status, 422);
    assert.deepEqual(await unavailableResponse.json(), {
      error: 'No available warehouse position for product-999999999.',
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

/** Checks the HTTP boundary before any route calculation is attempted. */
test('POST /optimize rejects invalid request bodies with a useful example', async () => {
  const server = createApp().listen(0);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('The test server did not receive a TCP port.');
    }

    const validBody = {
      products: ['product-1', 'product-2'],
      startingPosition: { x: 0, y: 0, z: 0 },
    };

    const cases = [
      { name: 'missing field', body: JSON.stringify({ products: ['product-1'] }), status: 400 },
      { name: 'extra field', body: JSON.stringify({ ...validBody, workerId: 'worker-1' }), status: 400 },
      { name: 'empty products', body: JSON.stringify({ ...validBody, products: [] }), status: 400 },
      { name: 'duplicate products', body: JSON.stringify({ ...validBody, products: ['product-1', 'product-1'] }), status: 400 },
      { name: 'wrong product type', body: JSON.stringify({ ...validBody, products: [123] }), status: 400 },
      { name: 'missing coordinate', body: JSON.stringify({ ...validBody, startingPosition: { x: 0, y: 0 } }), status: 400 },
      { name: 'wrong coordinate type', body: JSON.stringify({ ...validBody, startingPosition: { x: '0', y: 0, z: 0 } }), status: 400 },
      { name: 'JSON array instead of object', body: JSON.stringify([validBody]), status: 400 },
      { name: 'malformed JSON', body: '{"products":', status: 400 },
    ];

    for (const testCase of cases) {
      const response = await fetch(`http://localhost:${address.port}/optimize`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: testCase.body,
      });

      assert.equal(response.status, testCase.status, testCase.name);
      const result: unknown = await response.json();
      if (typeof result !== 'object' || result === null || !('error' in result) || !('example' in result)) {
        throw new Error(`${testCase.name}: expected an error response with an example`);
      }
      assert.equal(typeof result.error, 'string', testCase.name);
      assert.deepEqual(result.example, validBody, testCase.name);
    }

    const wrongContentType = await fetch(`http://localhost:${address.port}/optimize`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify(validBody),
    });
    assert.equal(wrongContentType.status, 415);
    const wrongContentTypeBody: unknown = await wrongContentType.json();
    if (typeof wrongContentTypeBody !== 'object' || wrongContentTypeBody === null || !('example' in wrongContentTypeBody)) {
      throw new Error('Expected an example for the unsupported content type');
    }
    assert.deepEqual(wrongContentTypeBody.example, validBody);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

/**
 * Tests warehouse position loading and error handling without live API calls.
 * npm test runs this file with a mocked fetch function.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchPositionsOfProducts, WarehouseClientError } from '../src/warehouse-client.js';

/** Verifies the GET URL, API key, and available positions for multiple products. */
test('fetchPositionsOfProducts loads and combines available positions', async (context) => {
  const previousKey = process.env.WAREHOUSE_API_KEY;
  const previousUrl = process.env.WAREHOUSE_API_BASE_URL;
  process.env.WAREHOUSE_API_KEY = 'test-key';
  process.env.WAREHOUSE_API_BASE_URL = 'https://warehouse.test/api';
  context.after(() => {
    if (previousKey === undefined) delete process.env.WAREHOUSE_API_KEY;
    else process.env.WAREHOUSE_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.WAREHOUSE_API_BASE_URL;
    else process.env.WAREHOUSE_API_BASE_URL = previousUrl;
  });

  const requestedUrls: string[] = [];
  context.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
    const url = String(input);
    requestedUrls.push(url);
    assert.equal(options?.method, 'GET');
    assert.deepEqual(options?.headers, { 'x-api-key': 'test-key' });

    const productId = url.includes('product-1') ? 'product-1' : 'product-2';
    return new Response(JSON.stringify([
      { positionId: `${productId}-available`, x: 1, y: 2, z: 0, productId, quantity: 3 },
      { positionId: `${productId}-empty`, x: 4, y: 5, z: 0, productId, quantity: 0 },
    ]), { status: 200 });
  });

  const positions = await fetchPositionsOfProducts(['product-1', 'product-2']);

  assert.deepEqual(requestedUrls, [
    'https://warehouse.test/api/products/product-1/positions',
    'https://warehouse.test/api/products/product-2/positions',
  ]);
  assert.deepEqual(positions.map((position) => position.positionId), [
    'product-1-available', 'product-2-available',
  ]);
});

/** Verifies that a successful HTTP response with no positions is not treated as stock. */
test('fetchPositionsOfProducts rejects a product without available positions', async (context) => {
  const previousKey = process.env.WAREHOUSE_API_KEY;
  process.env.WAREHOUSE_API_KEY = 'test-key';
  context.after(() => {
    if (previousKey === undefined) delete process.env.WAREHOUSE_API_KEY;
    else process.env.WAREHOUSE_API_KEY = previousKey;
  });
  context.mock.method(globalThis, 'fetch', async () => new Response('[]', { status: 200 }));

  await assert.rejects(fetchPositionsOfProducts(['product-1']), (error: unknown) =>
    error instanceof WarehouseClientError && error.statusCode === 422,
  );
});

/** Verifies that an upstream failure is reported separately from unavailable stock. */
test('fetchPositionsOfProducts reports warehouse API failures', async (context) => {
  const previousKey = process.env.WAREHOUSE_API_KEY;
  process.env.WAREHOUSE_API_KEY = 'test-key';
  context.after(() => {
    if (previousKey === undefined) delete process.env.WAREHOUSE_API_KEY;
    else process.env.WAREHOUSE_API_KEY = previousKey;
  });
  context.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status: 503 }));

  await assert.rejects(fetchPositionsOfProducts(['product-1']), (error: unknown) =>
    error instanceof WarehouseClientError && error.statusCode === 502,
  );
});

/** Data from an external service must be checked even after HTTP 200. */
test('fetchPositionsOfProducts rejects malformed warehouse data', async (context) => {
  const previousKey = process.env.WAREHOUSE_API_KEY;
  process.env.WAREHOUSE_API_KEY = 'test-key';
  context.after(() => {
    if (previousKey === undefined) delete process.env.WAREHOUSE_API_KEY;
    else process.env.WAREHOUSE_API_KEY = previousKey;
  });
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify([
    { productId: 'product-1', positionId: 'position-1', x: 'invalid', y: 0, z: 0, quantity: 1 },
  ]), { status: 200 }));

  await assert.rejects(fetchPositionsOfProducts(['product-1']), (error: unknown) =>
    error instanceof WarehouseClientError && error.statusCode === 502,
  );
});

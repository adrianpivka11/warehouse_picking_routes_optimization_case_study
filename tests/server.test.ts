import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/server.js';

/** Checks that the future optimization endpoint is reachable over HTTP. */
test('POST /optimize returns the current JSON placeholder response', async () => {
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

    assert.equal(response.status, 501);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
    assert.deepEqual(await response.json(), {
      error: 'Picking route optimization is not implemented yet.',
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

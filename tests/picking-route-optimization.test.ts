import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findShortestRoute } from '../src/picking-route-optimization.js';
import type { ProductPosition } from '../src/types.js';

/** Checks both the choice of storage position and the order of products. */
test('findShortestRoute chooses the shortest of eight possible routes', () => {
  const positions: ProductPosition[] = [
    { productId: 'A', positionId: 'A1', x: 1, y: 0, z: 0, quantity: 1 },
    { productId: 'A', positionId: 'A2', x: 8, y: 0, z: 0, quantity: 1 },
    { productId: 'B', positionId: 'B1', x: 9, y: 0, z: 0, quantity: 1 },
    { productId: 'B', positionId: 'B2', x: 12, y: 0, z: 0, quantity: 1 },
  ];

  const result = findShortestRoute({ x: 3, y: 0, z: 0 }, ['A', 'B'], positions);

  assert.deepEqual(result, {
    distance: 6,
    pickingOrder: [
      { productId: 'A', positionId: 'A2' },
      { productId: 'B', positionId: 'B1' },
    ],
  });
});

/** Checks the 3D distance formula and that the worker does not return to the start. */
test('findShortestRoute calculates a direct 3D leg', () => {
  const positions: ProductPosition[] = [
    { productId: 'A', positionId: 'A1', x: 4, y: 6, z: 1, quantity: 1 },
  ];

  const result = findShortestRoute({ x: 1, y: 2, z: 4 }, ['A'], positions);

  assert.equal(result.distance, Math.sqrt(34));
  assert.deepEqual(result.pickingOrder, [{ productId: 'A', positionId: 'A1' }]);
});

/** A position with no stock cannot be selected even when it is closer. */
test('findShortestRoute ignores positions with zero quantity', () => {
  const positions: ProductPosition[] = [
    { productId: 'A', positionId: 'empty', x: 0, y: 0, z: 0, quantity: 0 },
    { productId: 'A', positionId: 'available', x: 5, y: 0, z: 0, quantity: 1 },
  ];

  assert.deepEqual(findShortestRoute({ x: 0, y: 0, z: 0 }, ['A'], positions), {
    distance: 5,
    pickingOrder: [{ productId: 'A', positionId: 'available' }],
  });
});

/** The optimizer must not silently return a partial route. */
test('findShortestRoute rejects an order that cannot be completed', () => {
  const positions: ProductPosition[] = [
    { productId: 'A', positionId: 'A1', x: 1, y: 0, z: 0, quantity: 1 },
  ];

  assert.throws(
    () => findShortestRoute({ x: 0, y: 0, z: 0 }, ['A', 'B'], positions),
    /No complete picking route/,
  );
});

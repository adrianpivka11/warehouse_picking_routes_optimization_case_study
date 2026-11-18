/**
 * Tests 3D distances and the exact route search on small product orders.
 * npm test runs this file and compares results with independent exhaustive search.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findShortestRoute } from '../src/picking-route-optimization.js';
import type { Position, ProductPosition } from '../src/types.js';

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

/** Lists all product orders without using the production optimizer's pruning. */
function allOrders(productIds: string[]): string[][] {
  if (productIds.length === 0) return [[]];

  const orders: string[][] = [];
  for (const productId of productIds) {
    for (const rest of allOrders(productIds.filter((id) => id !== productId))) {
      orders.push([productId, ...rest]);
    }
  }
  return orders;
}

/** Independently checks every order and every choice of product position. */
function exhaustiveDistance(start: Position, productIds: string[], positions: ProductPosition[]): number {
  let minimum = Infinity;

  for (const order of allOrders(productIds)) {
    function choosePosition(index: number, current: Position, length: number): void {
      if (index === order.length) {
        minimum = Math.min(minimum, length);
        return;
      }

      for (const position of positions.filter((item) => item.productId === order[index])) {
        const leg = Math.hypot(position.x - current.x, position.y - current.y, position.z - current.z);
        choosePosition(index + 1, position, length + leg);
      }
    }

    choosePosition(0, start, 0);
  }

  return minimum;
}

/** Compares the pruned optimizer with full enumeration on varied small inputs. */
test('findShortestRoute matches exhaustive search for two to four products', () => {
  const start = { x: 2, y: -1, z: 0 };

  for (let scenario = 0; scenario < 12; scenario++) {
    const productIds = Array.from({ length: 2 + (scenario % 3) }, (_, index) => `product-${index}`);
    const positions: ProductPosition[] = [];

    for (let index = 0; index < productIds.length; index++) {
      for (let choice = 0; choice < 1 + ((scenario + index) % 3); choice++) {
        positions.push({
          productId: productIds[index]!,
          positionId: `position-${index}-${choice}`,
          x: ((scenario * 13 + index * 7 + choice * 11) % 21) - 10,
          y: ((scenario * 5 + index * 11 + choice * 3) % 17) - 8,
          z: ((scenario + index + choice) % 3) * 4,
          quantity: 1,
        });
      }
    }

    const expected = exhaustiveDistance(start, productIds, positions);
    const actual = findShortestRoute(start, productIds, positions);

    assert.ok(Math.abs(actual.distance - expected) < 1e-9, `scenario ${scenario}`);
    assert.equal(actual.pickingOrder.length, productIds.length, `scenario ${scenario}`);
    assert.deepEqual(
      [...actual.pickingOrder.map((stop) => stop.productId)].sort(),
      [...productIds].sort(),
      `scenario ${scenario}`,
    );
  }
});

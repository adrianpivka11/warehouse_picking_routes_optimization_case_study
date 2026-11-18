/**
 * Loads product positions and finds the shortest route using direct 3D distances.
 * The HTTP handler calls the service, while tests and the benchmark call its search function.
 */

import type { PickingRequest, PickingResult, PickingStop, Position, ProductPosition } from './types.js';
import { fetchPositionsOfProducts } from './warehouse-client.js';

/**
 * Calculates the direct distance between two positions in 3D space.
 * Shelves, walls and other obstacles are ignored as required by the case study.
 */
function distanceBetween(from: Position, to: Position): number {
  return Math.sqrt(
    (to.x - from.x) ** 2 +
    (to.y - from.y) ** 2 +
    (to.z - from.z) ** 2
  );
}

/**
 * Finds the exact shortest route through one position of every product.
 * The route starts at startingPosition and ends at the last picked product.
 */
export function findShortestRoute(
  startingPosition: Position,
  productIds: string[],
  positions: ProductPosition[],
): PickingResult {
  let bestDistance = Infinity;
  let bestOrder: PickingStop[] = [];
  let completeRoutes = 0;
  let prunedBranches = 0;
  const startedAt = performance.now();

  /** Builds one route by trying each remaining product and its positions. */
  function explore(
    currentPosition: Position,
    remainingProducts: string[],
    currentDistance: number,
    currentOrder: PickingStop[],
  ): void {
    // A complete route can replace the best route found so far.
    if (remainingProducts.length === 0) {
      completeRoutes++;
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        // Copy the order because later branches will change currentOrder.
        bestOrder = [...currentOrder];
      }
      return;
    }

    for (const productId of remainingProducts) {
      const availablePositions = positions.filter(
        (position) => position.productId === productId && position.quantity > 0,
      );

      for (const position of availablePositions) {
        const nextDistance = currentDistance + distanceBetween(currentPosition, position);

        // Future legs cannot reduce the distance already travelled.
        if (nextDistance >= bestDistance) {
          prunedBranches++;
          continue;
        }

        currentOrder.push({ productId, positionId: position.positionId });
        explore(
          position,
          remainingProducts.filter((id) => id !== productId),
          nextDistance,
          currentOrder,
        );
        // Restore the route before trying another position or product.
        currentOrder.pop();
      }
    }
  }

  explore(startingPosition, productIds, 0, []);

  if (bestDistance === Infinity) {
    throw new Error('No complete picking route could be found.');
  }

  console.info(
    `[ROUTE OPTIMIZER] Calculation took ${(performance.now() - startedAt).toFixed(1)} ms; completed routes: ${completeRoutes}; pruned branches: ${prunedBranches}`,
  );
  return { distance: bestDistance, pickingOrder: bestOrder };
}

/** Loads warehouse positions and returns the shortest route for one order. */
export async function optimizeTheShortestRoute(input: PickingRequest): Promise<PickingResult> {
  console.info('[ROUTE OPTIMIZER] Loading positions for:', input.products);
  const positionsOfProducts = await fetchPositionsOfProducts(input.products);
  console.info(`[ROUTE OPTIMIZER] Loaded ${positionsOfProducts.length} available positions; calculating route.`);
  const shortestRoute = findShortestRoute(input.startingPosition, input.products, positionsOfProducts);
  console.info('[ROUTE OPTIMIZER] Shortest route:', shortestRoute);
  return shortestRoute;
}

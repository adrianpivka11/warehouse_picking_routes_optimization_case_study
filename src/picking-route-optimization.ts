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

  /** Builds one route by trying each remaining product and its positions. */
  function explore(
    currentPosition: Position,
    remainingProducts: string[],
    currentDistance: number,
    currentOrder: PickingStop[],
  ): void {
    // A complete route can replace the best route found so far.
    if (remainingProducts.length === 0) {
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

  return { distance: bestDistance, pickingOrder: bestOrder };
}

/** Loads warehouse positions and returns the shortest route for one order. */
export async function optimizeTheShortestRoute(input: PickingRequest): Promise<PickingResult> {
  console.log('[ROUTE OPTIMIZER] Calling async fuction fetchPositionsOfProducts with input:', input.products)
  const positionsOfProducts = await fetchPositionsOfProducts(input.products);
  console.log('[ROUTE OPTIMIZER] Warehouse client returned following positions of products:', positionsOfProducts)
  const shortestRoute = findShortestRoute(input.startingPosition, input.products, positionsOfProducts)
  console.log('[ROUTE OPTIMIZER] Returning the shortest route to the Express server app:', shortestRoute)
  return shortestRoute ;
}

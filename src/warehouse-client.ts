import type { ProductPosition } from './types.js';

const defaultApiUrl = 'https://api.gymbeam.io/case-study-picking-optimization';

/** An error that the HTTP layer can turn into a clear response. */
export class WarehouseClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'WarehouseClientError';
  }
}

/** Checks data received from the external API before using it in our application. */
function isProductPosition(value: unknown, productId: string): value is ProductPosition {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const position = value as Record<string, unknown>;
  return (
    position.productId === productId &&
    typeof position.positionId === 'string' &&
    position.positionId.length > 0 &&
    typeof position.x === 'number' && Number.isFinite(position.x) &&
    typeof position.y === 'number' && Number.isFinite(position.y) &&
    typeof position.z === 'number' && Number.isFinite(position.z) &&
    typeof position.quantity === 'number' && Number.isInteger(position.quantity) &&
    position.quantity >= 0
  );
}

/**
 * Requests positions for each product and returns the positions with stock.
 * The external API accepts one product ID per GET request, so we make one call
 * for each ID and combine the results into a single array.
 */
export async function fetchPositionsOfProducts(productIds: string[]): Promise<ProductPosition[]> {
  const apiKey = process.env.WAREHOUSE_API_KEY;
  if (!apiKey) {
    throw new WarehouseClientError(500, 'Warehouse API key is not configured.');
  }

  const apiUrl = (process.env.WAREHOUSE_API_BASE_URL ?? defaultApiUrl).replace(/\/$/, '');
  const positions: ProductPosition[] = [];

  for (const productId of productIds) {
    const url = `${apiUrl}/products/${encodeURIComponent(productId)}/positions`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'x-api-key': apiKey },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new WarehouseClientError(502, `Warehouse API could not be reached for ${productId}.`);
    }

    if (!response.ok) {
      throw new WarehouseClientError(502, `Warehouse API returned HTTP ${response.status} for ${productId}.`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new WarehouseClientError(502, `Warehouse API returned invalid JSON for ${productId}.`);
    }

    if (!Array.isArray(data) || !data.every((position) => isProductPosition(position, productId))) {
      throw new WarehouseClientError(502, `Warehouse API returned invalid position data for ${productId}.`);
    }

    const availablePositions = data.filter((position: ProductPosition) => position.quantity > 0);
    if (availablePositions.length === 0) {
      throw new WarehouseClientError(422, `No available warehouse position for ${productId}.`);
    }

    positions.push(...availablePositions);
  }

  return positions;
}

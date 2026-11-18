import type { NextFunction, Request, Response } from 'express';
import { optimizeTheShortestRoute } from './picking-route-optimization.js';
import type { PickingRequest } from './types.js';
import { WarehouseClientError } from './warehouse-client.js';

/** Shows clients the structure expected by endpoint POST /optimize. */
const exampleRequest = {
  products: ['product-1', 'product-2'],
  startingPosition: { x: 0, y: 0, z: 0 },
};

/** Sends the same helpful JSON format for all request validation errors. */
function sendRequestError(response: Response, status: number, message: string): void {
  response.status(status).json({ error: message, example: exampleRequest });
}

/** Checks that an object contains exactly the expected properties. */
function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/**
 * Checks the shape and basic business rules of a parsed request body.
 * TypeScript types cannot check JSON received over HTTP, so these checks run at runtime.
 */
function validateRequestBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return 'The JSON body must be an object with products and startingPosition.';
  }

  const input = body as Record<string, unknown>;
  if (!hasExactKeys(input, ['products', 'startingPosition'])) {
    return 'The JSON body must contain exactly products and startingPosition.';
  }

  if (!Array.isArray(input.products) || input.products.length === 0) {
    return 'products must be a non-empty array of product IDs.';
  }

  if (input.products.some((product) => typeof product !== 'string' || product.trim() === '')) {
    return 'Every product ID must be a non-empty string.';
  }

  if (new Set(input.products).size !== input.products.length) {
    return 'products must not contain duplicate product IDs.';
  }

  const startingPosition = input.startingPosition;
  if (typeof startingPosition !== 'object' || startingPosition === null || Array.isArray(startingPosition)) {
    return 'startingPosition must be an object with x, y and z.';
  }

  const position = startingPosition as Record<string, unknown>;
  if (!hasExactKeys(position, ['x', 'y', 'z'])) {
    return 'startingPosition must contain exactly x, y and z.';
  }

  if (['x', 'y', 'z'].some((axis) => typeof position[axis] !== 'number' || !Number.isFinite(position[axis]))) {
    return 'x, y and z must be finite numbers.';
  }

  return null;
}

/**
 * Handles a request to optimize one order's picking route.
 * Invalid requests stop here. Valid requests are passed to the optimization function.
 */
export async function handleOptimizeRequest(request: Request, response: Response): Promise<void> {
  if (!request.is('application/json')) {
    sendRequestError(response, 415, 'Send the request body as application/json.');
    return;
  }

  
  const body: unknown = request.body;
  const validationError = validateRequestBody(body);
  if (validationError !== null) {
    sendRequestError(response, 400, validationError);
    return;
  }

  // Express has already parsed the JSON. Runtime checks above make this type assertion safe.
  const input = body as PickingRequest;
  console.log('[REQUEST HANDLER] Valid request has been received containing body:', body)
  console.log('[REQUEST HANDLER] Calling async fuction optimizeTheShortestRoute')
  const result = await optimizeTheShortestRoute(input);
  response.json(result);
}

/**
 * Converts JSON syntax errors from express.json() into the same JSON error format.
 * Express parses the body before it calls handleOptimizeRequest.
 */
export function handleJsonParseError(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof SyntaxError && 'body' in error) {
    sendRequestError(response, 400, 'The request body contains invalid JSON.');
    return;
  }

  if (error instanceof WarehouseClientError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  next(error);
}

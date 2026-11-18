import type { Request, Response } from 'express';

/**
 * Handles a request to optimize one order's picking route.
 * The endpoint is connected, but the route calculation will be added next.
 */
export function handleOptimizeRequest(_request: Request, response: Response): void {
  response.status(501).json({ error: 'Picking route optimization is not implemented yet.' });
}

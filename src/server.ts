import express, { type Express } from 'express';
import { handleJsonParseError, handleOptimizeRequest } from './http-request-handler.js';

/**
 * Creates the HTTP application and registers its single business endpoint.
 */
export function createApp(): Express {
  const app = express();

  // Parse JSON request bodies before passing them to the endpoint handler.
  app.use(express.json());
  app.post('/optimize', handleOptimizeRequest);
  // JSON syntax errors occur before the endpoint handler and arrive here instead.
  app.use(handleJsonParseError);

  return app;
}

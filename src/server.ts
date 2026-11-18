/**
 * Creates the Express application and registers the POST /optimize endpoint.
 * index.ts starts this application, and server.test.ts uses it in HTTP tests.
 */

import express, { type Express } from 'express';
import { handleOptimizeRequest, handleRequestError, logRequestOutcome } from './http-request-handler.js';


export function createApp(): Express {
  const app = express();

  // Start timing before JSON parsing so failed requests are measured too.
  app.use(logRequestOutcome);
  // Parse JSON request bodies before passing them to the endpoint handler.
  app.use(express.json());
  app.post('/optimize', handleOptimizeRequest);
  // Errors from JSON parsing, the warehouse API and the route handler arrive here.
  app.use(handleRequestError);

  return app;
}

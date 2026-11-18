# Tests

Run with `npm test`. Tests use `node:test` and do not require a live warehouse API or an API key.

- `server.test.ts` — **integration tests:** send real HTTP requests through the Express app; the warehouse API is mocked.
- `warehouse-client.test.ts` — **unit tests:** check position loading and API errors with a mocked `fetch`.
- `picking-route-optimization.test.ts` — **unit tests:** check distances and compare shortest routes with exhaustive search on small inputs.

`fixtures/warehouse-positions-10.json` provides repeatable data for `npm run benchmark`.

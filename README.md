# Warehouse Picking Routes Optimization

Node.js and TypeScript service for the GymBeam case study. `POST /optimize` loads product positions from the warehouse API and returns the shortest picking route.


## Setup

Requires Node.js 24.14.1 or later in the 24.x series and npm 11.

```powershell
npm ci
Copy-Item .env.example .env
```

Set `WAREHOUSE_API_KEY` in `.env` using the key provided in the assignment. Git ignores `.env`. Run `npm run dev`; the server listens at `http://localhost:3000` by default. Set `PORT` to use a different port.

## Request and response

In Postman, select `POST http://localhost:3000/optimize` and Body → raw → JSON:

```json
{
  "products": ["product-1", "product-2"],
  "startingPosition": { "x": 0, "y": 0, "z": 0 }
}
```

A `200` response looks like this:

```json
{
  "distance": 14.16227766016838,
  "pickingOrder": [
    { "productId": "product-1", "positionId": "position-31" },
    { "productId": "product-2", "positionId": "position-241" }
  ]
}
```

This is one observed result; current warehouse data may produce a different route.

The request requires a non-empty array of unique product IDs and finite numeric coordinates `x`, `y`, and `z`. Invalid JSON or input returns `400`; a `Content-Type` other than `application/json` returns `415`; a product with no available position returns `422`; a warehouse API failure returns `502`; and a missing API key or unexpected error returns `500`. Error responses contain `error`, and request errors also contain `example`.

## Calculation and limitations

The service selects one position with available stock for each product. It explores product orders and positions, pruning branches that cannot improve the best route found so far. Distance is measured as a straight line in 3D space; the route starts at `startingPosition` and ends at the last product. The model does not account for aisles, obstacles, or a return to the start.

The result is exact, but larger inputs may take a long time and block Node.js's main thread. There is no limit on order size or calculation time.

## Verification and performance

```sh
npm run typecheck
npm test
npm run build
npm run benchmark
```

Tests cover the endpoint, warehouse client, and optimizer, including a comparison with exhaustive search on small inputs. They do not need a live API. The benchmark uses a saved sample of 50 positions and measures calculation time without network calls. Median times from three runs on Windows with Node.js 24.14.1 and a Ryzen 5 5500U:

| Products | Positions | Calculation time |
| ---: | ---: | ---: |
| 2 | 8 | 0.1 ms |
| 4 | 21 | 0.4 ms |
| 6 | 28 | 12.9 ms |
| 8 | 40 | 181 ms |
| 10 | 50 | 7,121 ms |

Times also depend on the number of positions and the input data. Run `npm run benchmark` to measure performance on your machine.

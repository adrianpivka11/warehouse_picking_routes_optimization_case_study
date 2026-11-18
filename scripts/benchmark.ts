/**
 * Measures route search time on a fixed snapshot of warehouse positions.
 * npm run benchmark runs this script using the fixture in tests/fixtures.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { findShortestRoute } from '../src/picking-route-optimization.js';
import type { Position, ProductPosition } from '../src/types.js';

interface BenchmarkFixture {
  startingPosition: Position;
  productIds: string[];
  positions: ProductPosition[];
}

/** Returns the middle value from three measurements. */
function median(values: number[]): number {
  return [...values].sort((left, right) => left - right)[1]!;
}

/** Runs the same route calculation three times for each growing order. */
async function main(): Promise<void> {
  const file = new URL('../tests/fixtures/warehouse-positions-10.json', import.meta.url);
  const fixture = JSON.parse(await readFile(file, 'utf8')) as BenchmarkFixture;

  console.log('[BENCHMARK] Fixed GymBeam API snapshot; three runs per input size; no network calls.');
  console.log('[BENCHMARK] products | positions | median wall ms | median CPU ms | RSS after run MiB | result distance');

  for (const count of [2, 4, 6, 8, 10]) {
    const productIds = fixture.productIds.slice(0, count);
    const positions = fixture.positions.filter((position) => productIds.includes(position.productId));
    const wallTimes: number[] = [];
    const cpuTimes: number[] = [];
    let expectedDistance: number | undefined;

    for (let run = 0; run < 3; run++) {
      const cpuStart = process.cpuUsage();
      const wallStart = performance.now();
      const result = findShortestRoute(fixture.startingPosition, productIds, positions);
      const wallMs = performance.now() - wallStart;
      const cpu = process.cpuUsage(cpuStart);

      if (expectedDistance !== undefined) {
        assert.equal(result.distance, expectedDistance, 'Repeated runs must return the same distance.');
      }
      expectedDistance = result.distance;
      wallTimes.push(wallMs);
      cpuTimes.push((cpu.user + cpu.system) / 1000);
    }

    const rssMiB = (process.memoryUsage.rss() / 1024 ** 2).toFixed(1);
    console.log(
      `[BENCHMARK] ${count} | ${positions.length} | ${median(wallTimes).toFixed(1)} | ${median(cpuTimes).toFixed(1)} | ${rssMiB} | ${expectedDistance?.toFixed(6)}`,
    );
  }
}

await main();

/**
 * Reads and validates the HTTP port, using 3000 by default.
 * index.ts calls getPort() before starting the server.
 */
export function getPort(): number {
  const port = Number(process.env.PORT ?? '3000');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

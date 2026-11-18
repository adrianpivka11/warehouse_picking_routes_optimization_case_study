/**
 * Reads the HTTP port from the environment and uses 3000 by default.
 * The npm dev/start commands load .env into process.env when that file exists.
 */
export function getPort(): number {
  const port = Number(process.env.PORT ?? '3000');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

// TODO: Read WAREHOUSE_API_BASE_URL and WAREHOUSE_API_KEY when the API client is implemented.

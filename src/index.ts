/**
 * Starts the HTTP server on the configured port.
 * The npm dev and start commands run this file as the application entry point.
 */

import { getPort } from './env.js';
import { createApp } from './server.js';


const port = getPort();
const app = createApp();

app.listen(port, () => {
  console.info(`[SERVER] Picking optimization server is listening on http://localhost:${port}`);
});

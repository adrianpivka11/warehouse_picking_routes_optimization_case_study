import { getPort } from './env.js';
import { createApp } from './server.js';

/**
 * Starts the application on the configured port.
 * Keeping startup here lets tests create the Express app without opening port 3000.
 */
const port = getPort();
const app = createApp();

app.listen(port, () => {
  console.info(`Picking optimization server is listening on http://localhost:${port}`);
});

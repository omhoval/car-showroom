const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { connectDB, closeDB } = require('./src/config/db');

(async () => {
  await connectDB();
  const app = require('./src/app');
  const server = app.listen(env.PORT, () => logger.info(`API listening on port ${env.PORT}`));

  if (env.NODE_ENV !== 'test') require('./src/jobs/expireBookings.job').start();

  const shutdown = () => {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'Unhandled rejection');
    process.exit(1);
  });
})().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

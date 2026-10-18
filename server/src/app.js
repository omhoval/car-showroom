const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { globalRateLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(hpp());
app.use(pinoHttp({ logger }));
app.use(globalRateLimiter);
app.use('/api', require('./routes'));
app.use(notFound);
app.use(errorHandler);

module.exports = app;

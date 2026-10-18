const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

exports.notFound = (req, _res, next) => next(new ApiError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));

exports.errorHandler = (err, req, res, _next) => {
  let e = err;

  if (!(e instanceof ApiError)) {
    if (e.name === 'ZodError') {
      e = new ApiError('VALIDATION_ERROR', undefined, e.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
    } else if (e.name === 'CastError') {
      e = new ApiError('INVALID_ID');
    } else if (e.code === 11000) {
      const fields = Object.keys(e.keyPattern || {}).join(', ');
      e = new ApiError('DUPLICATE_RESOURCE', fields ? `Duplicate value for: ${fields}` : undefined);
    } else if (e.name === 'ValidationError') {
      e = new ApiError('VALIDATION_ERROR', undefined, Object.values(e.errors || {}).map((x) => ({ field: x.path, message: x.message })));
    } else if (e.name === 'TokenExpiredError') {
      e = new ApiError('TOKEN_EXPIRED');
    } else if (e.name === 'JsonWebTokenError') {
      e = new ApiError('UNAUTHENTICATED');
    } else if (e.type === 'entity.parse.failed') {
      e = new ApiError('VALIDATION_ERROR', 'Malformed JSON body');
    } else {
      logger.error({ err, reqId: req.id }, 'Unhandled error');
      e = new ApiError('INTERNAL_ERROR');
      if (env.NODE_ENV === 'development') e.stack = err.stack;
    }
  }

  const body = { success: false, message: e.message, errorCode: e.errorCode };
  if (e.errorCode === 'VALIDATION_ERROR' && e.details) body.details = e.details;
  if (env.NODE_ENV === 'development' && e.errorCode === 'INTERNAL_ERROR') body.stack = e.stack;
  res.status(e.statusCode).json(body);
};

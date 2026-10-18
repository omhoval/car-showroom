const ERROR_CODES = require('../constants/errorCodes');

class ApiError extends Error {
  constructor(errorCode, message, details) {
    const def = ERROR_CODES[errorCode];
    super(message || def.message);
    this.errorCode = errorCode;
    this.statusCode = def.status;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = ApiError;

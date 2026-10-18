exports.validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) {
        const parsed = schemas[key].parse(req[key]);
        if (key === 'query') {
          Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
        } else {
          req[key] = parsed;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

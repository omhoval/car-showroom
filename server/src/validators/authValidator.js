const { z, phone, password } = require('./common');

const email = z.string().trim().toLowerCase().email();

exports.register = z.object({ name: z.string().trim().min(2).max(100), email, phone, password });
exports.login = z.object({ email, password: z.string().min(1) });
exports.forgot = z.object({ email });
exports.reset = z.object({ token: z.string().min(10), password });

const { ROLES } = require('./roles');
const { ADMIN: A, MANAGER: M, SALES_EXECUTIVE: S, CUSTOMER: C } = ROLES;

const PERMISSIONS = {
  'cars:read': [A, M, S, C],
  'cars:write': [A, M],
  'cars:delete': [A, M],
  'cars:status': [A, M],
  'customers:read': [A, M, S, C],
  'customers:write': [A, M, S, C],
  'customers:delete': [A, M],
  'leads:read': [A, M, S, C],
  'leads:create': [A, M, S, C],
  'leads:write': [A, M, S],
  'leads:assign': [A, M],
  'leads:delete': [A, M],
  'testDrives:read': [A, M, S, C],
  'testDrives:create': [A, M, S, C],
  'testDrives:write': [A, M, S, C],
  'testDrives:delete': [A, M],
  'bookings:read': [A, M, S, C],
  'bookings:create': [A, M, S, C],
  'bookings:write': [A, M, S, C],
  'payments:read': [A, M, C],
  'payments:create': [A, M, S, C],
  'payments:verify': [A, M], // LLD-GAP: verification of customer payments
  'payments:refund': [A, M],
  'sales:read': [A, M, S, C],
  'sales:create': [A, M, S],
  'sales:deliver': [A, M],
  'users:manage': [A],
  'users:read': [A, M],
  'reports:read': [A, M],
  'dashboard:read': [A, M, S],
  'services:read': [A, M, S, C],
  'services:write': [A, M],
  'notifications:read': [A, M, S, C],
  'auditLogs:read': [A],
};

module.exports = PERMISSIONS;

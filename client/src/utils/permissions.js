const A = 'ADMIN', M = 'MANAGER', S = 'SALES_EXECUTIVE', C = 'CUSTOMER';

const MAP = {
  'cars:write': [A, M],
  'cars:status': [A, M],
  'cars:delete': [A, M],
  'customers:write': [A, M, S],
  'customers:delete': [A, M],
  'leads:write': [A, M, S],
  'leads:assign': [A, M],
  'leads:delete': [A, M],
  'testDrives:delete': [A, M],
  'payments:verify': [A, M],
  'payments:refund': [A, M],
  'sales:create': [A, M, S],
  'sales:deliver': [A, M],
  'services:write': [A, M],
  'users:manage': [A],
};

export const can = (role, perm) => (MAP[perm] || []).includes(role);
export const isStaff = (role) => role !== C;
export const isManager = (role) => role === A || role === M;

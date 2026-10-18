const { Types } = require('mongoose');
const { ROLES } = require('../constants/roles');

const oid = (v) => new Types.ObjectId(String(v));
const NOTHING = { _id: null };

function buildScopeFilter(resource, user) {
  if (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER) return {};

  if (user.role === ROLES.SALES_EXECUTIVE) {
    const me = oid(user.id);
    switch (resource) {
      case 'cars':
      case 'services':
        return {};
      case 'customers':
        return { $or: [{ assignedSalesExecutive: me }, { createdBy: me }] };
      case 'leads':
        return { assignedEmployeeId: me };
      case 'testDrives':
      case 'bookings':
      case 'sales':
        return { salesExecutiveId: me };
      default:
        return NOTHING;
    }
  }

  if (user.role === ROLES.CUSTOMER) {
    if (!user.customerId) return NOTHING;
    const cid = oid(user.customerId);
    if (resource === 'cars') return { status: 'AVAILABLE' };
    if (resource === 'customers') return { _id: cid };
    return { customerId: cid };
  }

  return NOTHING;
}

module.exports = { buildScopeFilter, oid };

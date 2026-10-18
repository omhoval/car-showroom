const Lead = require('../models/Lead');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { LEAD_TRANSITIONS, MANUAL_LEAD_STATUSES, assertTransition, canTransition } = require('../constants/statuses');
const { paginatedList, loadOrThrow, ensureExists, inList, dateRange } = require('../utils/query');
const audit = require('./auditService');
const notifications = require('./notificationService');

const populate = [
  { path: 'customerId', select: 'name phone email' },
  { path: 'interestedCarId', select: 'brand model variant price' },
  { path: 'assignedEmployeeId', select: 'name' },
];
const hideFor = (user) => (user.role === ROLES.CUSTOMER ? '-notes -lostReason' : undefined);

async function validateAssignee(id) {
  if (id) await ensureExists(User, id, 'Employee', { role: { $in: [ROLES.SALES_EXECUTIVE, ROLES.MANAGER] }, isActive: true });
}

exports.list = (query, user) =>
  paginatedList({
    Model: Lead, query, user, resource: 'leads',
    filters: {
      status: query.status ? inList(query.status) : undefined,
      source: query.source ? inList(query.source) : undefined,
      assignedEmployeeId: query.assignedEmployeeId,
      customerId: user.role === ROLES.CUSTOMER ? undefined : query.customerId,
      followUpDate: dateRange(query.from, query.to),
    },
    base: query.followUpDue === 'true' ? { status: 'FOLLOW_UP', followUpDate: { $lte: new Date() } } : {},
    sortFields: ['createdAt', 'followUpDate', 'status'],
    populate,
    select: hideFor(user),
  });

exports.get = (id, user) => loadOrThrow(Lead, id, { user, resource: 'leads', populate, select: hideFor(user), name: 'Lead' });

exports.create = async (body, user, ip) => {
  let customer;
  if (user.role === ROLES.CUSTOMER) {
    customer = await ensureExists(Customer, user.customerId, 'Customer');
  } else {
    if (!body.customerId) throw new ApiError('VALIDATION_ERROR', 'customerId is required', [{ field: 'customerId', message: 'Required' }]);
    customer = await ensureExists(Customer, body.customerId, 'Customer');
  }
  if (body.interestedCarId) await ensureExists(Car, body.interestedCarId, 'Car');

  let assignedEmployeeId = null;
  if (user.role === ROLES.SALES_EXECUTIVE) assignedEmployeeId = user.id;
  else if (user.role === ROLES.CUSTOMER) assignedEmployeeId = customer.assignedSalesExecutive || null;
  else {
    await validateAssignee(body.assignedEmployeeId);
    assignedEmployeeId = body.assignedEmployeeId || customer.assignedSalesExecutive || null;
  }

  const lead = await Lead.create({
    customerId: customer._id,
    interestedCarId: body.interestedCarId,
    source: user.role === ROLES.CUSTOMER ? 'WEBSITE' : body.source || 'WALK_IN',
    assignedEmployeeId,
    notes: body.note ? [{ text: body.note, createdBy: user.id }] : [],
    createdBy: user.id,
  });

  const recipients = assignedEmployeeId ? [assignedEmployeeId] : await notifications.managerIds();
  await notifications.notify(recipients, {
    type: 'NEW_LEAD', title: 'New enquiry', message: `${customer.name} submitted an enquiry`, entityType: 'LEAD', entityId: lead._id,
  });
  await audit.log({ actor: user, action: 'LEAD_CREATED', entityType: 'LEAD', entityId: lead._id, ip });
  return lead;
};

exports.update = async (id, body, user, ip) => {
  const lead = await loadOrThrow(Lead, id, { user, resource: 'leads', name: 'Lead' });
  if (['CONVERTED', 'LOST'].includes(lead.status)) throw new ApiError('INVALID_STATE_TRANSITION', `Lead is already ${lead.status}`);

  if (body.interestedCarId) await ensureExists(Car, body.interestedCarId, 'Car');
  if (body.source) lead.source = body.source;
  if (body.interestedCarId) lead.interestedCarId = body.interestedCarId;
  if (body.followUpDate) lead.followUpDate = body.followUpDate;

  if (body.status) {
    if (!MANUAL_LEAD_STATUSES.includes(body.status)) throw new ApiError('INVALID_STATE_TRANSITION', 'This status is set by the system');
    if (lead.status === 'BOOKING') throw new ApiError('INVALID_STATE_TRANSITION', 'Cancel the linked booking first');
    assertTransition(LEAD_TRANSITIONS, lead.status, body.status, 'lead');
    if (body.status === 'FOLLOW_UP' && !lead.followUpDate) {
      throw new ApiError('VALIDATION_ERROR', 'followUpDate is required', [{ field: 'followUpDate', message: 'Required for follow-up' }]);
    }
    if (body.status === 'LOST') {
      if (!body.lostReason) throw new ApiError('VALIDATION_ERROR', 'lostReason is required', [{ field: 'lostReason', message: 'Required when lost' }]);
      lead.lostReason = body.lostReason;
    }
    lead.status = body.status;
  }
  await lead.save();
  await audit.log({ actor: user, action: 'LEAD_UPDATED', entityType: 'LEAD', entityId: lead._id, changes: body.status ? { status: { to: body.status } } : undefined, ip });
  return lead;
};

exports.assign = async (id, employeeId, user, ip) => {
  const lead = await loadOrThrow(Lead, id, { name: 'Lead' });
  await validateAssignee(employeeId);
  lead.assignedEmployeeId = employeeId;
  await lead.save();
  await notifications.notify([employeeId], {
    type: 'LEAD_ASSIGNED', title: 'Lead assigned to you', entityType: 'LEAD', entityId: lead._id,
  });
  await audit.log({ actor: user, action: 'LEAD_ASSIGNED', entityType: 'LEAD', entityId: lead._id, changes: { assignedEmployeeId: { to: employeeId } }, ip });
  return lead;
};

exports.addNote = async (id, text, user) => {
  const lead = await loadOrThrow(Lead, id, { user, resource: 'leads', name: 'Lead' });
  lead.notes.push({ text, createdBy: user.id });
  await lead.save();
  return lead;
};

exports.remove = async (id, user, ip) => {
  const lead = await loadOrThrow(Lead, id, { name: 'Lead' });
  lead.isDeleted = true;
  lead.deletedAt = new Date();
  await lead.save();
  await audit.log({ actor: user, action: 'LEAD_DELETED', entityType: 'LEAD', entityId: id, ip });
};

exports.systemTransition = async (leadId, to, extra = {}, session) => {
  if (!leadId) return;
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false }).session(session || null);
  if (!lead || !canTransition(LEAD_TRANSITIONS, lead.status, to)) return;
  lead.status = to;
  Object.entries(extra).forEach(([k, v]) => {
    lead[k] = v;
  });
  await lead.save({ session });
};

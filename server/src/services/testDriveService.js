const TestDrive = require('../models/TestDrive');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { TEST_DRIVE_TRANSITIONS, assertTransition } = require('../constants/statuses');
const { paginatedList, loadOrThrow, ensureExists, inList, dateRange } = require('../utils/query');
const notifications = require('./notificationService');
const leadService = require('./leadService');

const populate = [
  { path: 'customerId', select: 'name phone' },
  { path: 'carId', select: 'brand model variant' },
  { path: 'salesExecutiveId', select: 'name' },
];

const overlap = (start, end) => ({ status: 'SCHEDULED', isDeleted: false, scheduledAt: { $lt: end }, endsAt: { $gt: start } });

async function carBusy({ carId, start, end, excludeId }) {
  const q = { ...overlap(start, end), carId };
  if (excludeId) q._id = { $ne: excludeId };
  return TestDrive.exists(q);
}

async function execBusy({ execId, start, end, excludeId }) {
  const q = { ...overlap(start, end), salesExecutiveId: execId };
  if (excludeId) q._id = { $ne: excludeId };
  return TestDrive.exists(q);
}

async function pickExecutive({ explicit, preferred, start, end, excludeId }) {
  if (explicit) {
    await ensureExists(User, explicit, 'Sales executive', { role: ROLES.SALES_EXECUTIVE, isActive: true });
    if (await execBusy({ execId: explicit, start, end, excludeId })) throw new ApiError('TEST_DRIVE_SLOT_CONFLICT', 'Sales executive is busy at that time');
    return explicit;
  }
  const execs = (await User.find({ role: ROLES.SALES_EXECUTIVE, isActive: true }).select('_id').lean()).map((u) => String(u._id));
  const ordered = preferred ? [String(preferred), ...execs.filter((e) => e !== String(preferred))] : execs;
  for (const execId of ordered) {
    if (!execs.includes(execId)) continue;
    if (!(await execBusy({ execId, start, end, excludeId }))) return execId;
  }
  throw new ApiError('TEST_DRIVE_SLOT_CONFLICT', 'No sales executive is free at that time');
}

exports.list = (query, user) => {
  const day = new Date();
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));
  return paginatedList({
    Model: TestDrive, query, user, resource: 'testDrives',
    filters: {
      status: query.status ? inList(query.status) : undefined,
      carId: query.carId,
      customerId: user.role === ROLES.CUSTOMER ? undefined : query.customerId,
      salesExecutiveId: query.salesExecutiveId,
      scheduledAt: query.today === 'true' ? { $gte: start, $lte: end } : dateRange(query.from, query.to),
    },
    sortFields: ['scheduledAt', 'createdAt', 'status'],
    defaultSort: '-scheduledAt',
    populate,
  });
};

exports.get = (id, user) => loadOrThrow(TestDrive, id, { user, resource: 'testDrives', populate, name: 'Test drive' });

exports.create = async (body, user) => {
  const customerId = user.role === ROLES.CUSTOMER ? user.customerId : body.customerId;
  if (!customerId) throw new ApiError('VALIDATION_ERROR', 'customerId is required', [{ field: 'customerId', message: 'Required' }]);
  const customer = await ensureExists(Customer, customerId, 'Customer');
  const car = await ensureExists(Car, body.carId, 'Car');
  if (car.status !== 'AVAILABLE') throw new ApiError('CAR_NOT_AVAILABLE');

  const start = body.scheduledAt;
  if (start.getTime() <= Date.now()) throw new ApiError('VALIDATION_ERROR', 'Test drive must be in the future', [{ field: 'scheduledAt', message: 'Must be in the future' }]);
  const duration = body.durationMinutes || env.TEST_DRIVE_DURATION_MIN;
  const end = new Date(start.getTime() + duration * 60000);

  let lead = null;
  if (body.leadId) {
    lead = await ensureExists(Lead, body.leadId, 'Lead', { customerId });
  }
  if (await carBusy({ carId: car._id, start, end })) throw new ApiError('TEST_DRIVE_SLOT_CONFLICT', 'This car already has a test drive at that time');

  const salesExecutiveId =
    user.role === ROLES.SALES_EXECUTIVE
      ? user.id
      : await pickExecutive({ explicit: body.salesExecutiveId, preferred: lead?.assignedEmployeeId || customer.assignedSalesExecutive, start, end });
  if (user.role === ROLES.SALES_EXECUTIVE && (await execBusy({ execId: user.id, start, end }))) {
    throw new ApiError('TEST_DRIVE_SLOT_CONFLICT', 'You already have a test drive at that time');
  }

  const drive = await TestDrive.create({
    customerId, carId: car._id, salesExecutiveId, leadId: lead?._id, scheduledAt: start,
    durationMinutes: duration, remarks: body.remarks, createdBy: user.id,
  });
  await leadService.systemTransition(lead?._id, 'TEST_DRIVE');
  await notifications.notify([salesExecutiveId], {
    type: 'TEST_DRIVE_SCHEDULED', title: 'Test drive scheduled',
    message: `${customer.name} - ${car.brand} ${car.model}`, entityType: 'TEST_DRIVE', entityId: drive._id,
  });
  return drive;
};

exports.update = async (id, body, user) => {
  const drive = await loadOrThrow(TestDrive, id, { user, resource: 'testDrives', name: 'Test drive' });
  const isCustomer = user.role === ROLES.CUSTOMER;

  if (isCustomer) {
    const onlyCancel = body.status === 'CANCELLED' && Object.keys(body).every((k) => ['status', 'cancelReason'].includes(k));
    if (!onlyCancel) throw new ApiError('FORBIDDEN', 'You can only cancel your test drive');
    if (drive.scheduledAt.getTime() - Date.now() < 2 * 3600000) {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Test drives can be cancelled up to 2 hours before the start');
    }
  }

  if (body.status) {
    assertTransition(TEST_DRIVE_TRANSITIONS, drive.status, body.status, 'test drive');
    if (['COMPLETED', 'NO_SHOW'].includes(body.status) && Date.now() < drive.scheduledAt.getTime()) {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Test drive has not started yet');
    }
    if (body.status === 'CANCELLED') {
      if (!body.cancelReason) throw new ApiError('VALIDATION_ERROR', 'cancelReason is required', [{ field: 'cancelReason', message: 'Required' }]);
      drive.cancelReason = body.cancelReason;
    }
    drive.status = body.status;
  } else if (drive.status !== 'SCHEDULED') {
    throw new ApiError('INVALID_STATE_TRANSITION', 'Only scheduled test drives can be edited');
  }

  if ((body.scheduledAt || body.durationMinutes || body.salesExecutiveId) && !body.status) {
    const start = body.scheduledAt || drive.scheduledAt;
    if (start.getTime() <= Date.now()) throw new ApiError('VALIDATION_ERROR', 'Test drive must be in the future', [{ field: 'scheduledAt', message: 'Must be in the future' }]);
    const duration = body.durationMinutes || drive.durationMinutes;
    const end = new Date(start.getTime() + duration * 60000);
    const execId = body.salesExecutiveId || drive.salesExecutiveId;
    if (await carBusy({ carId: drive.carId, start, end, excludeId: drive._id })) throw new ApiError('TEST_DRIVE_SLOT_CONFLICT');
    if (await execBusy({ execId, start, end, excludeId: drive._id })) throw new ApiError('TEST_DRIVE_SLOT_CONFLICT');
    if (body.salesExecutiveId) await ensureExists(User, execId, 'Sales executive', { role: ROLES.SALES_EXECUTIVE, isActive: true });
    drive.scheduledAt = start;
    drive.durationMinutes = duration;
    drive.salesExecutiveId = execId;
  }
  if (body.remarks !== undefined) drive.remarks = body.remarks;
  await drive.save();

  if (drive.status === 'CANCELLED') {
    await notifications.notify([drive.salesExecutiveId], {
      type: 'TEST_DRIVE_CANCELLED', title: 'Test drive cancelled', entityType: 'TEST_DRIVE', entityId: drive._id,
    });
  }
  return drive;
};

exports.remove = async (id) => {
  const drive = await loadOrThrow(TestDrive, id, { name: 'Test drive' });
  drive.isDeleted = true;
  drive.deletedAt = new Date();
  await drive.save();
};

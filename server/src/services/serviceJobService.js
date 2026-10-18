const Service = require('../models/Service');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const ApiError = require('../utils/ApiError');
const { SERVICE_TRANSITIONS, assertTransition } = require('../constants/statuses');
const { paginatedList, loadOrThrow, ensureExists, inList, dateRange } = require('../utils/query');

const populate = [
  { path: 'customerId', select: 'name phone' },
  { path: 'carId', select: 'brand model variant vin' },
];

exports.list = (query, user) =>
  paginatedList({
    Model: Service, query, user, resource: 'services', softDelete: false,
    filters: {
      status: query.status ? inList(query.status) : undefined,
      serviceType: query.serviceType ? inList(query.serviceType) : undefined,
      carId: query.carId,
      customerId: query.customerId,
      serviceDate: dateRange(query.from, query.to),
    },
    searchFields: ['technician', 'remarks'],
    sortFields: ['serviceDate', 'createdAt', 'status', 'cost'],
    defaultSort: '-serviceDate',
    populate,
  });

exports.get = (id, user) => loadOrThrow(Service, id, { user, resource: 'services', softDelete: false, populate, name: 'Service' });

exports.create = async (body, user) => {
  await ensureExists(Customer, body.customerId, 'Customer');
  await ensureExists(Car, body.carId, 'Car');
  if (body.serviceType !== 'PDI') {
    const sold = await Sale.exists({ carId: body.carId, customerId: body.customerId });
    if (!sold) throw new ApiError('VALIDATION_ERROR', 'This car was not sold to the selected customer');
  }
  return Service.create({ ...body, createdBy: user.id });
};

exports.update = async (id, body) => {
  const service = await loadOrThrow(Service, id, { softDelete: false, name: 'Service' });
  if (['COMPLETED', 'CANCELLED'].includes(service.status)) throw new ApiError('INVALID_STATE_TRANSITION', `Service is already ${service.status}`);
  if (body.status) {
    assertTransition(SERVICE_TRANSITIONS, service.status, body.status, 'service');
    service.status = body.status;
    if (body.status === 'COMPLETED') service.completedAt = new Date();
  }
  ['serviceDate', 'technician', 'cost', 'remarks'].forEach((k) => {
    if (body[k] !== undefined) service[k] = body[k];
  });
  await service.save();
  return service;
};

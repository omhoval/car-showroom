const ApiError = require('./ApiError');
const escapeRegex = require('./escapeRegex');
const { parsePagination, buildSort, buildMeta } = require('./pagination');
const { buildScopeFilter } = require('./scope');

const inList = (v) => ({ $in: String(v).split(',').map((s) => s.trim()).filter(Boolean) });

function dateRange(from, to) {
  const r = {};
  if (from) r.$gte = new Date(`${String(from).slice(0, 10)}T00:00:00.000Z`);
  if (to) r.$lte = new Date(`${String(to).slice(0, 10)}T23:59:59.999Z`);
  return Object.keys(r).length ? r : undefined;
}

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

async function paginatedList({
  Model, query, user, resource, base = {}, filters = {}, searchFields = [], sortFields = [],
  defaultSort = '-createdAt', populate, select, softDelete = true,
}) {
  const { page, limit, skip } = parsePagination(query);
  const and = [base, buildScopeFilter(resource, user), compact(filters)];
  if (softDelete) and.push({ isDeleted: false });
  if (query.search && searchFields.length) {
    const rx = { $regex: escapeRegex(String(query.search)), $options: 'i' };
    and.push({ $or: searchFields.map((f) => ({ [f]: rx })) });
  }
  const parts = and.filter((f) => f && Object.keys(f).length);
  const filter = parts.length ? { $and: parts } : {};
  const sort = buildSort(query.sort, sortFields, defaultSort);

  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);
  const [data, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return { data, meta: buildMeta(total, page, limit) };
}

async function loadOrThrow(Model, id, { user, resource, populate, softDelete = true, select, session, name = 'Resource' } = {}) {
  const filter = { _id: id };
  if (softDelete) filter.isDeleted = false;
  const scope = user && resource ? buildScopeFilter(resource, user) : {};
  let q = Model.findOne({ $and: [filter, scope].filter((f) => Object.keys(f).length) });
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);
  if (session) q = q.session(session);
  const doc = await q;
  if (!doc) throw new ApiError('NOT_FOUND', `${name} not found`);
  return doc;
}

async function ensureExists(Model, id, name, extra = {}, session) {
  if (!id) return null;
  let q = Model.findOne({ _id: id, ...(Model.schema.path('isDeleted') ? { isDeleted: false } : {}), ...extra });
  if (session) q = q.session(session);
  const doc = await q;
  if (!doc) throw new ApiError('NOT_FOUND', `${name} not found`);
  return doc;
}

module.exports = { inList, dateRange, compact, paginatedList, loadOrThrow, ensureExists };

function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function buildSort(sortParam, allowedFields = [], defaultSort = '-createdAt') {
  const parts = String(sortParam || '').split(',').map((s) => s.trim()).filter(Boolean);
  const sort = {};
  for (const p of parts) {
    const desc = p.startsWith('-');
    const field = desc ? p.slice(1) : p;
    if (allowedFields.includes(field)) sort[field] = desc ? -1 : 1;
  }
  if (Object.keys(sort).length) return sort;
  const desc = defaultSort.startsWith('-');
  return { [desc ? defaultSort.slice(1) : defaultSort]: desc ? -1 : 1 };
}

const buildMeta = (total, page, limit) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

module.exports = { parsePagination, buildSort, buildMeta };

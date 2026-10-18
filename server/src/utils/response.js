exports.ok = (res, data, message) => res.status(200).json({ success: true, data, ...(message && { message }) });
exports.created = (res, data, message) => res.status(201).json({ success: true, data, ...(message && { message }) });
exports.paginated = (res, data, meta) => res.status(200).json({ success: true, data, meta });

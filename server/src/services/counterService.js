const Counter = require('../models/Counter');

exports.next = async (prefix, session) => {
  const year = new Date().getFullYear();
  const doc = await Counter.findOneAndUpdate(
    { _id: `${prefix}-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return `${prefix}-${year}-${String(doc.seq).padStart(6, '0')}`;
};

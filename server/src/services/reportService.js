const Car = require('../models/Car');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const User = require('../models/User');
const { dateRange } = require('../utils/query');

exports.sales = async (query) => {
  const range = dateRange(query.from, query.to);
  const match = range ? { saleDate: range } : {};
  const byYear = query.groupBy === 'year';
  const [totals, series] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      { $group: { _id: null, totalSales: { $sum: 1 }, revenue: { $sum: '$finalAmount' }, discount: { $sum: '$discount' }, tax: { $sum: '$tax' } } },
    ]),
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: byYear ? { y: { $year: '$saleDate' } } : { y: { $year: '$saleDate' }, m: { $month: '$saleDate' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
  ]);
  const t = totals[0] || { totalSales: 0, revenue: 0, discount: 0, tax: 0 };
  return {
    summary: { totalSales: t.totalSales, revenue: t.revenue, discount: t.discount, tax: t.tax },
    series: series.map((s) => ({
      period: byYear ? String(s._id.y) : `${s._id.y}-${String(s._id.m).padStart(2, '0')}`,
      sales: s.sales,
      revenue: s.revenue,
    })),
  };
};

exports.inventory = async () => {
  const match = { $match: { isDeleted: false } };
  const pivot = {
    total: { $sum: 1 },
    available: { $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0] } },
    reserved: { $sum: { $cond: [{ $eq: ['$status', 'RESERVED'] }, 1, 0] } },
    sold: { $sum: { $cond: [{ $eq: ['$status', 'SOLD'] }, 1, 0] } },
  };
  const [byStatus, byBrand, byModel] = await Promise.all([
    Car.aggregate([match, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Car.aggregate([match, { $group: { _id: '$brand', ...pivot } }, { $sort: { total: -1 } }]),
    Car.aggregate([match, { $group: { _id: { brand: '$brand', model: '$model' }, ...pivot } }, { $sort: { total: -1 } }]),
  ]);
  return {
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    byBrand: byBrand.map(({ _id, ...r }) => ({ brand: _id, ...r })),
    byModel: byModel.map(({ _id, ...r }) => ({ brand: _id.brand, model: _id.model, ...r })),
  };
};

exports.employees = async (query) => {
  const range = dateRange(query.from, query.to);
  const within = (field) => (range ? { [field]: range } : {});
  const group = (key, extra = {}) => ({ $group: { _id: `$${key}`, count: { $sum: 1 }, ...extra } });
  const [staff, leads, drives, bookings, sales] = await Promise.all([
    User.find({ role: { $in: ['SALES_EXECUTIVE', 'MANAGER'] }, isActive: true }).select('name role').lean(),
    Lead.aggregate([{ $match: { isDeleted: false, ...within('createdAt') } }, group('assignedEmployeeId')]),
    TestDrive.aggregate([{ $match: { isDeleted: false, ...within('scheduledAt') } }, group('salesExecutiveId')]),
    Booking.aggregate([{ $match: within('createdAt') }, group('salesExecutiveId')]),
    Sale.aggregate([{ $match: within('saleDate') }, group('salesExecutiveId', { revenue: { $sum: '$finalAmount' } })]),
  ]);
  const pick = (list, id) => list.find((x) => String(x._id) === String(id));
  return staff.map((u) => ({
    id: u._id,
    name: u.name,
    role: u.role,
    leadsHandled: pick(leads, u._id)?.count || 0,
    testDrives: pick(drives, u._id)?.count || 0,
    bookings: pick(bookings, u._id)?.count || 0,
    sales: pick(sales, u._id)?.count || 0,
    revenue: pick(sales, u._id)?.revenue || 0,
  }));
};

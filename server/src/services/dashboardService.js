const Car = require('../models/Car');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const { ROLES } = require('../constants/roles');
const { buildScopeFilter } = require('../utils/scope');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.get = async (user) => {
  const sc = (r) => buildScopeFilter(r, user);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const seriesStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const isManager = user.role === ROLES.ADMIN || user.role === ROLES.MANAGER;

  const [carStatus, customers, newLeads, pendingFollowUps, todaysTestDrives, totalBookings, month, series, brands, funnel, perf] =
    await Promise.all([
      Car.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Customer.countDocuments({ isDeleted: false, ...sc('customers') }),
      Lead.countDocuments({ isDeleted: false, status: 'NEW', ...sc('leads') }),
      Lead.countDocuments({ isDeleted: false, status: 'FOLLOW_UP', followUpDate: { $lte: dayEnd }, ...sc('leads') }),
      TestDrive.countDocuments({ isDeleted: false, status: { $in: ['SCHEDULED', 'COMPLETED'] }, scheduledAt: { $gte: dayStart, $lte: dayEnd }, ...sc('testDrives') }),
      Booking.countDocuments(sc('bookings')),
      Sale.aggregate([
        { $match: { saleDate: { $gte: monthStart }, ...sc('sales') } },
        { $group: { _id: null, sales: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: seriesStart }, ...sc('sales') } },
        { $group: { _id: { y: { $year: '$saleDate' }, m: { $month: '$saleDate' } }, sales: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
      ]),
      Sale.aggregate([
        { $match: sc('sales') },
        { $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'car' } },
        { $unwind: '$car' },
        { $group: { _id: '$car.brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Lead.aggregate([{ $match: { isDeleted: false, ...sc('leads') } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      isManager
        ? Sale.aggregate([
            { $group: { _id: '$salesExecutiveId', sales: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
            { $unwind: '$u' },
            { $project: { name: '$u.name', sales: 1, revenue: 1 } },
            { $sort: { revenue: -1 } },
            { $limit: 8 },
          ])
        : [],
    ]);

  const byStatus = Object.fromEntries(carStatus.map((c) => [c._id, c.count]));
  const monthly = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hit = series.find((s) => s._id.y === d.getFullYear() && s._id.m === d.getMonth() + 1);
    monthly.push({ month: MONTHS[d.getMonth()], sales: hit?.sales || 0, revenue: hit?.revenue || 0 });
  }

  return {
    metrics: {
      totalCars: carStatus.reduce((s, c) => s + c.count, 0),
      availableCars: byStatus.AVAILABLE || 0,
      reservedCars: byStatus.RESERVED || 0,
      soldCars: byStatus.SOLD || 0,
      inServiceCars: byStatus.IN_SERVICE || 0,
      totalCustomers: customers,
      newLeads,
      pendingFollowUps,
      todaysTestDrives,
      totalBookings,
      monthlySales: month[0]?.sales || 0,
      monthlyRevenue: month[0]?.revenue || 0,
    },
    charts: {
      monthly,
      soldByBrand: brands.map((b) => ({ brand: b._id, count: b.count })),
      leadFunnel: funnel.map((f) => ({ status: f._id, count: f.count })),
      inventory: carStatus.map((c) => ({ status: c._id, count: c.count })),
      executivePerformance: perf.map((p) => ({ name: p.name, sales: p.sales, revenue: p.revenue })),
    },
  };
};

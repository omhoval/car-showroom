const bcrypt = require('bcrypt');
const env = require('../src/config/env');
const { connectDB, closeDB } = require('../src/config/db');
const User = require('../src/models/User');
const Car = require('../src/models/Car');
const Customer = require('../src/models/Customer');

const staff = [
  { name: 'Aarav Admin', email: 'admin@showroom.com', phone: '9000000001', role: 'ADMIN', password: 'Admin@123' },
  { name: 'Meera Manager', email: 'manager@showroom.com', phone: '9000000002', role: 'MANAGER', password: 'Manager@123' },
  { name: 'Rohan Sales', email: 'sales@showroom.com', phone: '9000000003', role: 'SALES_EXECUTIVE', password: 'Sales@123' },
  { name: 'Sneha Sales', email: 'sales2@showroom.com', phone: '9000000004', role: 'SALES_EXECUTIVE', password: 'Sales@123' },
];

const cars = [
  ['Tata', 'Nexon', 'Creative+', 2026, 'PETROL', 'AUTOMATIC', 'Blue', 1250000, 'MA1TA2NEX0000001A', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'],
  ['Tata', 'Punch', 'Accomplished', 2026, 'PETROL', 'MANUAL', 'White', 850000, 'MA1TA2PUN0000002B', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80'],
  ['Hyundai', 'Creta', 'SX(O)', 2025, 'DIESEL', 'AUTOMATIC', 'Grey', 1950000, 'MALHY2CRE0000003C', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80'],
  ['Hyundai', 'Venue', 'S+', 2025, 'PETROL', 'MANUAL', 'Red', 1020000, 'MALHY2VEN0000004D', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80'],
  ['Maruti Suzuki', 'Brezza', 'ZXi+', 2026, 'CNG', 'MANUAL', 'Silver', 1180000, 'MA3MA2BRE0000005E', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80'],
  ['Mahindra', 'XUV700', 'AX7', 2025, 'DIESEL', 'AUTOMATIC', 'Black', 2450000, 'MA1MH2XUV0000006F', 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80'],
  ['Kia', 'Seltos', 'HTX', 2026, 'PETROL', 'AUTOMATIC', 'White', 1790000, 'MZBKI2SEL0000007G', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'],
  ['Tata', 'Nexon EV', 'Empowered', 2026, 'ELECTRIC', 'AUTOMATIC', 'Teal', 1760000, 'MA1TA2NEV0000008H', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1536987333706-fc9adfb10d91?auto=format&fit=crop&w=1200&q=80'],
].map(([brand, model, variant, manufacturingYear, fuelType, transmission, color, price, vin, ...imageUrls]) => ({
  brand, model, variant, manufacturingYear, fuelType, transmission, color, price, vin,
  images: imageUrls.map((url, index) => ({ url, isPrimary: index === 0 })),
  description: `${brand} ${model} ${variant} in ${color}.`,
}));

(async () => {
  await connectDB();
  for (const s of staff) {
    const { password, ...rest } = s;
    await User.updateOne({ email: s.email }, { $setOnInsert: { ...rest, passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS) } }, { upsert: true });
  }
  const exec = await User.findOne({ email: 'sales@showroom.com' });
  for (const c of cars) await Car.updateOne({ vin: c.vin }, { $setOnInsert: c }, { upsert: true });
  await Customer.updateOne(
    { phone: '9876543210', isDeleted: false },
    { $setOnInsert: { name: 'Rahul Verma', phone: '9876543210', email: 'rahul@example.com', city: 'Pune', state: 'Maharashtra', assignedSalesExecutive: exec._id } },
    { upsert: true }
  );
  console.log('Seed complete. Logins:');
  staff.forEach((s) => console.log(`  ${s.role.padEnd(16)} ${s.email} / ${s.password}`));
  await closeDB();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

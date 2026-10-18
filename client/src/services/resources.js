import api from './api';

const unwrap = (r) => r.data.data;

function crud(base) {
  return {
    list: (params) => api.get(base, { params }).then((r) => r.data),
    get: (id) => api.get(`${base}/${id}`).then(unwrap),
    create: (body) => api.post(base, body).then(unwrap),
    update: (id, body) => api.put(`${base}/${id}`, body).then(unwrap),
    remove: (id) => api.delete(`${base}/${id}`).then(unwrap),
  };
}

export const authApi = {
  login: (body) => api.post('/auth/login', body).then(unwrap),
  register: (body) => api.post('/auth/register', body).then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  forgot: (body) => api.post('/auth/forgot-password', body).then((r) => r.data),
  reset: (body) => api.post('/auth/reset-password', body).then((r) => r.data),
};

export const carApi = { ...crud('/cars'), setStatus: (id, status) => api.patch(`/cars/${id}/status`, { status }).then(unwrap) };
export const customerApi = { ...crud('/customers'), history: (id) => api.get(`/customers/${id}/history`).then(unwrap) };
export const leadApi = {
  ...crud('/leads'),
  assign: (id, assignedEmployeeId) => api.patch(`/leads/${id}/assign`, { assignedEmployeeId }).then(unwrap),
  addNote: (id, text) => api.post(`/leads/${id}/notes`, { text }).then(unwrap),
};
export const testDriveApi = crud('/test-drives');
export const bookingApi = crud('/bookings');
export const paymentApi = {
  list: (params) => api.get('/payments', { params }).then((r) => r.data),
  create: (body) => api.post('/payments', body).then(unwrap),
  verify: (id, body) => api.patch(`/payments/${id}/verify`, body).then(unwrap),
  refund: (id, body) => api.post(`/payments/${id}/refund`, body).then(unwrap),
};
export const saleApi = {
  list: (params) => api.get('/sales', { params }).then((r) => r.data),
  create: (body) => api.post('/sales', body).then(unwrap),
  deliver: (id, body = {}) => api.patch(`/sales/${id}/deliver`, body).then(unwrap),
};
export const serviceApi = crud('/services');
export const userApi = { list: (params) => api.get('/users', { params }).then((r) => r.data), create: (b) => api.post('/users', b).then(unwrap), update: (id, b) => api.put(`/users/${id}`, b).then(unwrap) };
export const dashboardApi = { get: () => api.get('/dashboard').then(unwrap) };
export const reportApi = {
  sales: (params) => api.get('/reports/sales', { params }).then(unwrap),
  inventory: () => api.get('/reports/inventory').then(unwrap),
  employees: (params) => api.get('/reports/employees', { params }).then(unwrap),
};
export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  unread: () => api.get('/notifications/unread-count').then(unwrap),
  read: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  readAll: () => api.patch('/notifications/read-all').then(unwrap),
};
export const auditApi = { list: (params) => api.get('/audit-logs', { params }).then((r) => r.data) };

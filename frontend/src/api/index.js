import client from './client';

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  logout: () => client.post('/auth/logout'),
};

export const usersApi = {
  getAll: (params) => client.get('/users', { params }),
  getOne: (id) => client.get(`/users/${id}`),
  update: (id, data) => client.patch(`/users/${id}`, data),
};

export const inventoryApi = {
  getAll: (params) => client.get('/inventory', { params }),
  getOne: (id) => client.get(`/inventory/${id}`),
  create: (data) => client.post('/inventory', data),
  update: (id, data) => client.patch(`/inventory/${id}`, data),
  delete: (id) => client.delete(`/inventory/${id}`),
  getLowStock: () => client.get('/inventory/low-stock'),
  getCategories: () => client.get('/inventory/categories'),
};

export const procurementApi = {
  getOrders: (params) => client.get('/procurement/orders', { params }),
  createOrder: (data) => client.post('/procurement/orders', data),
  approveOrder: (id) => client.patch(`/procurement/orders/${id}/approve`),
  updateStatus: (id, status) => client.patch(`/procurement/orders/${id}/status`, { status }),
  getSuppliers: (params) => client.get('/procurement/suppliers', { params }),
  createSupplier: (data) => client.post('/procurement/suppliers', data),
  updateSupplier: (id, data) => client.patch(`/procurement/suppliers/${id}`, data),
};

export const hrApi = {
  getEmployees: (params) => client.get('/hr/employees', { params }),
  getEmployee: (id) => client.get(`/hr/employees/${id}`),
  createEmployee: (data) => client.post('/hr/employees', data),
  updateEmployee: (id, data) => client.patch(`/hr/employees/${id}`, data),
  getDepartments: () => client.get('/hr/employees/departments'),
  getLeaveRequests: (params) => client.get('/hr/leave-requests', { params }),
  createLeaveRequest: (data) => client.post('/hr/leave-requests', data),
  approveLeave: (id) => client.patch(`/hr/leave-requests/${id}/approve`),
  rejectLeave: (id) => client.patch(`/hr/leave-requests/${id}/reject`),
};

export const reportsApi = {
  getAll: (params) => client.get('/reports', { params }),
  getOne: (id) => client.get(`/reports/${id}`),
  generate: (type) => client.post('/reports/generate', { type }),
  getDashboardStats: () => client.get('/reports/dashboard-stats'),
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('tapmenu_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getMenu: (hotelSlug) => request(`/menu/${hotelSlug}`),
  placeOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrderStatus: (orderId) => request(`/orders/${orderId}/status`),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getStaffOrders: (status) => request(`/staff/orders${status ? `?status=${status}` : ''}`),
  updateOrderStatus: (id, status) =>
    request(`/staff/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Admin — categories
  getCategories: () => request('/admin/categories'),
  createCategory: (payload) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Admin — menu items
  getMenuItems: () => request('/admin/menu-items'),
  createMenuItem: (payload) =>
    request('/admin/menu-items', { method: 'POST', body: JSON.stringify(payload) }),
  updateMenuItem: (id, payload) =>
    request(`/admin/menu-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteMenuItem: (id) => request(`/admin/menu-items/${id}`, { method: 'DELETE' }),

  // Admin — tables
  getTables: () => request('/admin/tables'),
  createTable: (payload) =>
    request('/admin/tables', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTable: (id) => request(`/admin/tables/${id}`, { method: 'DELETE' }),
};
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';

const STATUS_COLORS = {
  pending: 'bg-amber-100 border-amber-400',
  preparing: 'bg-blue-100 border-blue-400',
  served: 'bg-green-100 border-green-400',
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'served', served: 'paid' };

export default function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadOrders = () => {
    api
      .getStaffOrders()
      .then((data) => setOrders(data.filter((o) => o.status !== 'paid' && o.status !== 'cancelled')))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await api.updateOrderStatus(order.id, next);
    loadOrders();
  };

  const logout = () => {
    localStorage.removeItem('tapmenu_token');
    navigate('/');
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      {/* Header bar — closes the "two half-built pages" gap */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <span className="font-bold text-primary text-lg">ServeEasy</span>
        <div className="flex items-center gap-4 text-sm">
          <button className="text-primary underline" onClick={() => navigate('/admin')}>
            Manage menu
          </button>
          <button className="text-gray-500" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Live Orders</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div key={order.id} className={`border-2 rounded-lg p-4 ${STATUS_COLORS[order.status]}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">
                  Table {order.tables?.table_number ?? '—'}
                </span>
                <span className="text-xs uppercase font-semibold">{order.status}</span>
              </div>
              <ul className="text-sm mb-3 space-y-1">
                {order.order_items?.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.item_name}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold mb-3">₹{order.total_amount}</p>
              {NEXT_STATUS[order.status] && (
                <button
                  className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium"
                  onClick={() => advanceStatus(order)}
                >
                  Mark as {NEXT_STATUS[order.status]}
                </button>
              )}
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500">No active orders.</p>}
        </div>
      </div>
    </div>
  );
}
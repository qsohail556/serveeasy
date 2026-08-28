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

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Live Orders</h1>
        <button className="text-sm text-primary underline" onClick={() => navigate('/admin')}>
          Manage menu →
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div key={order.id} className={`border-2 rounded-lg p-4 ${STATUS_COLORS[order.status]}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">Table {order.table_id?.slice(0, 4)}</span>
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
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useCart } from '../../context/CartContext.jsx';

export default function CustomerMenu() {
  const { hotelSlug, tableId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const { items, addItem, updateQuantity, total, clearCart } = useCart();

  useEffect(() => {
    api
      .getMenu(hotelSlug)
      .then((data) => {
        setHotel(data.hotel);
        setMenu(data.menu);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hotelSlug]);

  const placeOrder = async () => {
    try {
      const payload = {
        table_id: tableId,
        items: items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
      };
      const result = await api.placeOrder(payload);
      setOrderId(result.order_id);
      clearCart();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading menu…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  if (orderId) {
    return (
      <div className="p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold">Order placed 🎉</h1>
        <p className="text-gray-600">Order #{orderId.slice(0, 8)} — pay at the counter when ready.</p>
        <button
          className="mt-4 text-primary underline"
          onClick={() => setOrderId(null)}
        >
          Add more items
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <h1 className="font-semibold text-lg">{hotel?.name}</h1>
        <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">Table {tableId.slice(0, 4)}</span>
      </div>

      {/* Menu by category */}
      <div className="p-4 space-y-8">
        {menu.map((category) => (
          <div key={category.id}>
            <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border rounded-lg p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-sm border ${
                          item.is_veg ? 'border-green-600' : 'border-red-600'
                        }`}
                      >
                        <span
                          className={`block w-1.5 h-1.5 m-auto mt-0.5 rounded-full ${
                            item.is_veg ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        />
                      </span>
                      <p className="font-medium">{item.name}</p>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                    <p className="text-sm font-semibold mt-1">₹{item.price}</p>
                  </div>
                  <button
                    className="bg-primary text-white text-sm px-4 py-2 rounded-lg"
                    onClick={() =>
                      addItem({ menu_item_id: item.id, name: item.name, price: item.price })
                    }
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating cart bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 flex justify-between items-center">
          <span>
            🛒 {items.reduce((n, i) => n + i.quantity, 0)} items · ₹{total.toFixed(2)}
          </span>
          <button className="bg-white text-primary font-semibold px-4 py-2 rounded-lg" onClick={placeOrder}>
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}

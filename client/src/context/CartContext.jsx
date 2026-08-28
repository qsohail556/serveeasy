import { createContext, useContext, useState, useMemo } from 'react';

// In-memory cart state only — per project rules, no localStorage/sessionStorage.
// If persistence across reloads is needed later, persist via the backend
// against the table/order session instead.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ menu_item_id, name, price, quantity }]

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.menu_item_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menu_item_id !== menuItemId));
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) return removeItem(menuItemId);
    setItems((prev) =>
      prev.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

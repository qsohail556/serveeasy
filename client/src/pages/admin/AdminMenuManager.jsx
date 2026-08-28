import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function AdminMenuManager() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_veg: true,
  });

  useEffect(() => {
    if (!localStorage.getItem('tapmenu_token')) {
      navigate('/staff/login');
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [cats, menuItems, tbls] = await Promise.all([
        api.getCategories(),
        api.getMenuItems(),
        api.getTables(),
      ]);
      setCategories(cats);
      setItems(menuItems);
      setTables(tbls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.createCategory({ name: newCategory.trim(), sort_order: categories.length });
      setNewCategory('');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCategory = async (id) => {
    if (!confirm('Delete this category? Items in it will keep their data but lose their category link.')) return;
    try {
      await api.deleteCategory(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim() || itemForm.price === '') return;
    try {
      await api.createMenuItem({
        ...itemForm,
        price: parseFloat(itemForm.price),
        category_id: itemForm.category_id || null,
      });
      setItemForm({ name: '', description: '', price: '', category_id: '', is_veg: true });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await api.updateMenuItem(item.id, { is_available: !item.is_available });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeItem = async (id) => {
    if (!confirm('Delete this menu item permanently?')) return;
    try {
      await api.deleteMenuItem(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const addTable = async (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    try {
      await api.createTable({ table_number: newTableNumber.trim() });
      setNewTableNumber('');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTable = async (id) => {
    if (!confirm('Delete this table? Its QR code will stop working.')) return;
    try {
      await api.deleteTable(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '— Uncategorized —';

  if (loading) return <div className="p-6 text-center text-gray-500">Loading admin panel…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-10 pb-16">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <button className="text-sm text-primary underline" onClick={() => navigate('/staff')}>
          View live orders →
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm p-3 rounded-lg">{error}</div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <form onSubmit={addCategory} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="e.g. Desserts"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 border rounded-lg p-2"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="bg-gray-100 border rounded-full px-3 py-1 text-sm flex items-center gap-2"
            >
              {cat.name}
              <button
                onClick={() => removeCategory(cat.id)}
                className="text-gray-400 hover:text-red-600"
                aria-label={`Delete ${cat.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {categories.length === 0 && <p className="text-gray-400 text-sm">No categories yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Menu Items</h2>
        <form onSubmit={addItem} className="border rounded-lg p-4 space-y-3 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-name" className="block text-sm mb-1">Name</label>
              <input
                id="item-name"
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label htmlFor="item-price" className="block text-sm mb-1">Price (₹)</label>
              <input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="item-desc" className="block text-sm mb-1">Description</label>
            <input
              id="item-desc"
              type="text"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-category" className="block text-sm mb-1">Category</label>
              <select
                id="item-category"
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">— Uncategorized —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <input
                id="item-veg"
                type="checkbox"
                checked={itemForm.is_veg}
                onChange={(e) => setItemForm({ ...itemForm, is_veg: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="item-veg" className="text-sm">Vegetarian</label>
            </div>
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
            Add Menu Item
          </button>
        </form>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center border rounded-lg p-3">
              <div>
                <p className="font-medium">
                  {item.name} <span className="text-gray-400 text-sm">· {categoryName(item.category_id)}</span>
                </p>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAvailable(item)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {item.is_available ? 'Available' : 'Sold out'}
                </button>
                <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-400 text-sm">No menu items yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tables & QR Codes</h2>
        <form onSubmit={addTable} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Table number (e.g. 5)"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="flex-1 border rounded-lg p-2"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
            Add Table
          </button>
        </form>

        <div className="grid sm:grid-cols-2 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="border rounded-lg p-4 flex items-center gap-4">
              {table.qr_code_url && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    table.qr_code_url
                  )}`}
                  alt={`QR code for table ${table.table_number}`}
                  className="w-24 h-24 border rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">Table {table.table_number}</p>
                 <a 
                  href={table.qr_code_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline break-all"
                >
                  {table.qr_code_url}
                </a>
                <button
                  onClick={() => removeTable(table.id)}
                  className="block text-red-500 text-sm mt-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {tables.length === 0 && <p className="text-gray-400 text-sm">No tables yet.</p>}
        </div>
      </section>
    </div>
  );
}
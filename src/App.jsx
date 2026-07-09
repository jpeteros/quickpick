import { useEffect, useMemo, useState } from 'react';

const initialItems = [
  { id: 1, name: 'Cola', category: 'Drinks', stock: 8, price: 1.5, minStock: 5 },
  { id: 2, name: 'Chips', category: 'Snacks', stock: 3, price: 1.2, minStock: 5 },
  { id: 3, name: 'Gum', category: 'Candy', stock: 12, price: 0.75, minStock: 6 },
];
const emptyForm = { name: '', category: 'Snacks', stock: 5, price: 1 };
const inventoryUrl = import.meta.env.PROD ? '/api/items.json' : '/api/items';

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

function App() {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await requestJson(inventoryUrl);
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const summary = useMemo(() => {
    const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
    const lowStockCount = items.filter((item) => item.stock <= item.minStock).length;
    const totalValue = items.reduce((sum, item) => sum + item.stock * item.price, 0);

    return { totalStock, lowStockCount, totalValue };
  }, [items]);

  const restockItems = items.filter((item) => item.stock <= item.minStock);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleStockChange = async (id, delta) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    try {
      const updatedItems = await requestJson(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: Math.max(0, item.stock + delta) }),
      });
      setItems(updatedItems);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        const updatedItems = await requestJson(`/api/items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            stock: Number(form.stock),
            price: Number(form.price),
          }),
        });
        setItems(updatedItems);
      } else {
        const createdItems = await requestJson(inventoryUrl, {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            stock: Number(form.stock),
            price: Number(form.price),
            minStock: 5,
          }),
        });
        setItems(createdItems);
      }

      resetForm();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      stock: item.stock,
      price: item.price,
    });
  };

  const handleDelete = async (id) => {
    try {
      const updatedItems = await requestJson(`/api/items/${id}`, {
        method: 'DELETE',
      });
      setItems(updatedItems);
      if (editingId === id) {
        resetForm();
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Vending Machine Control Panel</p>
          <h1>Inventory Overview</h1>
          <p className="subtitle">Track stock, restock quickly, and keep popular items available.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Stock</span>
            <strong>{summary.totalStock}</strong>
          </div>
          <div className="stat-card">
            <span>Low Stock</span>
            <strong>{summary.lowStockCount}</strong>
          </div>
          <div className="stat-card">
            <span>Value</span>
            <strong>${summary.totalValue.toFixed(2)}</strong>
          </div>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>{editingId ? 'Edit Product' : 'Add a Product'}</h2>
            {editingId ? <button className="secondary" onClick={resetForm}>Cancel</button> : null}
          </div>

          <form onSubmit={handleSubmit} className="inventory-form">
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sparkling Water" />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="Drinks">Drinks</option>
                <option value="Snacks">Snacks</option>
                <option value="Candy">Candy</option>
                <option value="Healthy">Healthy</option>
              </select>
            </label>
            <label>
              Stock
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </label>
            <button type="submit">{editingId ? 'Update Item' : 'Add Item'}</button>
          </form>

          <div className="restock-panel">
            <h3>Restock Needed</h3>
            {error ? <p className="muted">{error}</p> : null}
            {loading ? (
              <p className="muted">Loading inventory…</p>
            ) : restockItems.length === 0 ? (
              <p className="muted">All products are above their minimum stock.</p>
            ) : (
              <ul>
                {restockItems.map((item) => (
                  <li key={item.id}>
                    {item.name} — {item.stock} left (min {item.minStock})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Current Inventory</h2>
          <div className="inventory-list">
            {!loading && items.length === 0 ? <p className="muted">No inventory items yet.</p> : null}
            {items.map((item) => (
              <article key={item.id} className={`inventory-card ${item.stock <= item.minStock ? 'low-stock' : ''}`}>
                <div>
                  <p className="item-category">{item.category}</p>
                  <h3>{item.name}</h3>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="item-controls">
                  <div className="stock-pill">{item.stock} in stock</div>
                  <div className="actions">
                    <button onClick={() => handleStockChange(item.id, -1)}>-</button>
                    <button onClick={() => handleStockChange(item.id, 1)}>+</button>
                  </div>
                  <div className="actions secondary-actions">
                    <button className="secondary" onClick={() => startEditing(item)}>Edit</button>
                    <button className="secondary danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

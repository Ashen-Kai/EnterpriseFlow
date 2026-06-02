import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { inventoryApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Inventory() {
  const { isManager } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ sku: '', name: '', description: '', category: '', quantity: 0, unitPrice: 0, reorderLevel: 10 });

  useEffect(() => { loadItems(); }, [page, search]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAll({ page, limit: 15, search });
      setItems(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ sku: '', name: '', description: '', category: '', quantity: 0, unitPrice: 0, reorderLevel: 10 });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ sku: item.sku, name: item.name, description: item.description || '', category: item.category, quantity: item.quantity, unitPrice: item.unitPrice, reorderLevel: item.reorderLevel });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await inventoryApi.update(editItem.id, form);
      } else {
        await inventoryApi.create(form);
      }
      setShowModal(false);
      loadItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await inventoryApi.delete(id);
      loadItems();
    } catch (err) { alert('Failed to delete'); }
  };

  const getStockLevel = (qty, reorder) => {
    const ratio = qty / Math.max(reorder, 1);
    if (ratio <= 1) return 'low';
    if (ratio <= 2) return 'medium';
    return 'high';
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="glass-card animate-fade-in">
        <div className="card-header">
          <div className="table-toolbar" style={{ width: '100%' }}>
            <div className="search-input-wrapper">
              <Search />
              <input
                className="search-input"
                placeholder="Search items by name or SKU..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {isManager && (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add Item
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Stock Level</th>
                <th>Supplier</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 8 : 7}>
                    <div className="empty-state">
                      <Package />
                      <h3>No inventory items</h3>
                      <p>Add your first item to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const level = getStockLevel(item.quantity, item.reorderLevel);
                  return (
                    <tr key={item.id}>
                      <td><code style={{ color: 'var(--accent-secondary)', fontSize: '0.8125rem' }}>{item.sku}</code></td>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="badge badge-neutral">{item.category}</span></td>
                      <td>{item.quantity.toLocaleString()}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>
                        <div className="stock-indicator">
                          <div className="stock-bar">
                            <div
                              className={`stock-bar-fill ${level}`}
                              style={{ width: `${Math.min((item.quantity / Math.max(item.reorderLevel * 3, 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`badge badge-${level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'danger'}`} style={{ fontSize: '0.6875rem' }}>
                            {level}
                          </span>
                        </div>
                      </td>
                      <td>{item.supplier?.name || '—'}</td>
                      {isManager && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn-icon" onClick={() => openEdit(item)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: 'var(--status-danger)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </div>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editItem ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" disabled={!!editItem} />
        </div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Raw Materials" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Price ($)</label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Level</label>
            <input className="form-input" type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, ShoppingCart } from 'lucide-react';
import { procurementApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Procurement() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactEmail: '', phone: '', address: '' });

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    else loadSuppliers();
  }, [page, search, tab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await procurementApi.getOrders({ page, limit: 15, search });
      setOrders(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await procurementApi.getSuppliers({ page, limit: 15, search });
      setSuppliers(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await procurementApi.approveOrder(id);
      loadOrders();
    } catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
  };

  const handleCreateSupplier = async () => {
    try {
      await procurementApi.createSupplier(supplierForm);
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contactEmail: '', phone: '', address: '' });
      loadSuppliers();
    } catch (err) { alert('Failed to create supplier'); }
  };

  const statusBadge = (status) => {
    const map = {
      DRAFT: 'info', PENDING: 'warning', APPROVED: 'success', RECEIVED: 'success', CANCELLED: 'danger',
    };
    return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('orders'); setPage(1); setSearch(''); }}>
          <ShoppingCart size={16} /> Purchase Orders
        </button>
        <button className={`btn ${tab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('suppliers'); setPage(1); setSearch(''); }}>
          Suppliers
        </button>
      </div>

      <div className="glass-card animate-fade-in">
        <div className="card-header">
          <div className="table-toolbar" style={{ width: '100%' }}>
            <div className="search-input-wrapper">
              <Search />
              <input
                className="search-input"
                placeholder={tab === 'orders' ? 'Search orders...' : 'Search suppliers...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {isManager && tab === 'suppliers' && (
              <button className="btn btn-primary" onClick={() => setShowSupplierModal(true)}>
                <Plus size={16} /> Add Supplier
              </button>
            )}
          </div>
        </div>

        {tab === 'orders' ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6}>
                      <div className="empty-state">
                        <ShoppingCart />
                        <h3>No purchase orders</h3>
                        <p>Orders will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.orderNumber}</strong></td>
                      <td>{order.supplier?.name}</td>
                      <td>${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>{statusBadge(order.status)}</td>
                      <td>{order.createdBy?.name}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      {isManager && (
                        <td>
                          {(order.status === 'DRAFT' || order.status === 'PENDING') && (
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(order.id)}>
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <h3>No suppliers</h3>
                        <p>Add suppliers to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.contactEmail || '—'}</td>
                      <td>{s.phone || '—'}</td>
                      <td className="truncate" style={{ maxWidth: 200 }}>{s.address || '—'}</td>
                      <td>
                        <span style={{ color: 'var(--status-warning)' }}>{'★'.repeat(Math.round(s.rating))}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - Math.round(s.rating))}</span>
                        <span className="text-xs text-muted" style={{ marginLeft: 6 }}>{s.rating.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Page {page} of {totalPages}</div>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Add Supplier"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSupplier}>Create</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="form-input" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="Acme Industrial" />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input className="form-input" type="email" value={supplierForm.contactEmail} onChange={(e) => setSupplierForm({ ...supplierForm, contactEmail: e.target.value })} placeholder="contact@supplier.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+1-555-0100" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-input" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Full address" />
        </div>
      </Modal>
    </div>
  );
}

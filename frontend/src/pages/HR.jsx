import { useState, useEffect } from 'react';
import { Plus, Search, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { hrApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function HR() {
  const { isManager } = useAuth();
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeCode: '', name: '', email: '', department: '', designation: '',
    dateOfJoining: '', salary: 0, phone: '',
  });

  useEffect(() => {
    if (tab === 'employees') loadEmployees();
    else loadLeaves();
  }, [page, search, tab]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await hrApi.getEmployees({ page, limit: 15, search });
      setEmployees(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await hrApi.getLeaveRequests({ page, limit: 15 });
      setLeaves(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateEmployee = async () => {
    try {
      await hrApi.createEmployee({ ...form, salary: parseFloat(form.salary) });
      setShowModal(false);
      loadEmployees();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create employee'); }
  };

  const handleApproveLeave = async (id) => {
    try { await hrApi.approveLeave(id); loadLeaves(); }
    catch (err) { alert('Failed to approve'); }
  };

  const handleRejectLeave = async (id) => {
    try { await hrApi.rejectLeave(id); loadLeaves(); }
    catch (err) { alert('Failed to reject'); }
  };

  const statusBadge = (status) => {
    const map = { ACTIVE: 'success', ON_LEAVE: 'warning', TERMINATED: 'danger', PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
    return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button className={`btn ${tab === 'employees' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('employees'); setPage(1); setSearch(''); }}>
          <Users size={16} /> Employees
        </button>
        <button className={`btn ${tab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('leaves'); setPage(1); setSearch(''); }}>
          <Calendar size={16} /> Leave Requests
        </button>
      </div>

      <div className="glass-card animate-fade-in">
        <div className="card-header">
          <div className="table-toolbar" style={{ width: '100%' }}>
            <div className="search-input-wrapper">
              <Search />
              <input className="search-input" placeholder={tab === 'employees' ? 'Search employees...' : 'Search leave requests...'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {isManager && tab === 'employees' && (
              <button className="btn btn-primary" onClick={() => { setForm({ employeeCode: '', name: '', email: '', department: '', designation: '', dateOfJoining: '', salary: 0, phone: '' }); setShowModal(true); }}>
                <Plus size={16} /> Add Employee
              </button>
            )}
          </div>
        </div>

        {tab === 'employees' ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><Users /><h3>No employees</h3><p>Add employees to manage</p></div></td></tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td><code style={{ color: 'var(--accent-secondary)', fontSize: '0.8125rem' }}>{emp.employeeCode}</code></td>
                      <td><strong>{emp.name}</strong><div className="text-xs text-muted">{emp.email}</div></td>
                      <td><span className="badge badge-neutral">{emp.department}</span></td>
                      <td>{emp.designation}</td>
                      <td>${emp.salary.toLocaleString()}</td>
                      <td>{statusBadge(emp.status)}</td>
                      <td>{new Date(emp.dateOfJoining).toLocaleDateString()}</td>
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
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr><td colSpan={isManager ? 7 : 6}><div className="empty-state"><Calendar /><h3>No leave requests</h3></div></td></tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td><strong>{leave.employee?.name}</strong><div className="text-xs text-muted">{leave.employee?.employeeCode}</div></td>
                      <td>{leave.employee?.department}</td>
                      <td><span className="badge badge-info">{leave.leaveType}</span></td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>{statusBadge(leave.status)}</td>
                      {isManager && (
                        <td>
                          {leave.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button className="btn btn-success btn-sm" onClick={() => handleApproveLeave(leave.id)}>
                                <CheckCircle size={14} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRejectLeave(leave.id)}>
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
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

      {/* Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Employee"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateEmployee}>Create</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Employee Code</label>
            <input className="form-input" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP-006" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="employee@company.com" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
          </div>
          <div className="form-group">
            <label className="form-label">Designation</label>
            <input className="form-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Developer" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Join Date</label>
            <input className="form-input" type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Salary ($)</label>
            <input className="form-input" type="number" min="0" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0100" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

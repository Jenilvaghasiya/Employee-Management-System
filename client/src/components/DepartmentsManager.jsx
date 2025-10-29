import { useEffect, useMemo, useState } from 'react';
import { departmentsService } from '../services/departmentsService';

const initialForm = { name: '', status: 'Active' };

const DepartmentsManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');

const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((it) =>
    String(it.name || "")
      .toLowerCase()
      .includes(q) ||
    String(it.status || "")
      .toLowerCase()
      .includes(q)
  );
}, [items, query]);


  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await departmentsService.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.name?.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await departmentsService.update(editingId, { name: form.name.trim(), status: form.status });
      } else {
        await departmentsService.create({ name: form.name.trim(), status: form.status });
      }
      await fetchAll();
      resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || '', status: row.status || 'Active' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete department "${row.name}"?`)) return;
    try {
      await departmentsService.remove(row.id);
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <section className="departments-wrap">
      <div className="departments-toolbar">
        <h2>Departments</h2>
        <div className="departments-actions">
          <input
            type="text"
            placeholder="Search departments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="dep-input"
          />
        </div>
      </div>

      {error && <div className="dep-alert error">{error}</div>}

      <form className="dep-form" onSubmit={handleSubmit}>
        <div className="dep-form-row">
          <div className="dep-field">
            <label>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g., Engineering"
              className="dep-input"
              required
            />
          </div>
          <div className="dep-field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              className="dep-input"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="dep-form-actions">
          {editingId ? (
            <>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update'}
              </button>
              <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Department'}
            </button>
          )}
        </div>
      </form>

      <div className="dep-table-card">
        <div className="dep-table-head">
          <span>Total: {items.length}</span>
          <button className="btn refresh" onClick={fetchAll} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="dep-table-wrap">
          <table className="dep-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>ID</th>
                <th>Name</th>
                <th style={{width: '140px'}}>Status</th>
                <th style={{width: '160px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="center">Loading...</td>
                </tr>
              ) : filtered.length ? (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>
                      <span className={`badge ${row.status === 'Active' ? 'success' : 'muted'}`}>
                        {row.status || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => handleEdit(row)}>Edit</button>
                        <button className="btn small danger" onClick={() => handleDelete(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="center">No departments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .departments-wrap { display: grid; gap: 20px; }
        .departments-toolbar { display:flex; align-items:center; justify-content:space-between; }
        .departments-toolbar h2 { font-size: 22px; color:#1f2937; font-weight:700; }
        .dep-input { padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:14px; background:#fff; }
        .dep-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15) }
        .dep-form { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.04) }
        .dep-form-row { display:grid; grid-template-columns: 1fr 200px; gap:16px; }
        .dep-field { display:flex; flex-direction:column; gap:8px; }
        .dep-field label { font-size:12px; font-weight:600; color:#374151; }
        .dep-form-actions { display:flex; gap:10px; margin-top:4px; }
        .btn { padding:10px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-size:14px; }
        .btn.primary { background:#2563eb; color:#fff; }
        .btn.primary:hover { background:#1d4ed8 }
        .btn.ghost { background:#f3f4f6; color:#374151 }
        .btn.ghost:hover { background:#e5e7eb }
        .btn.refresh { background:#f3f4f6; }
        .btn.refresh:hover { background:#e5e7eb }
        .btn.small { padding:8px 10px; }
        .btn.danger { background:#ef4444; color:#fff }
        .btn.danger:hover { background:#dc2626 }
        .dep-table-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.04) }
        .dep-table-head { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #e5e7eb; color:#4b5563 }
        .dep-table-wrap { width:100%; overflow-x:auto; }
        .dep-table { width:100%; border-collapse:collapse; }
        .dep-table th, .dep-table td { padding:12px 16px; border-bottom:1px solid #f1f5f9; text-align:left; }
        .dep-table th { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:#6b7280; background:#fafbfc }
        .center { text-align:center; color:#6b7280 }
        .row-actions { display:flex; gap:8px }
        .badge { padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700 }
        .badge.success { background:#ecfdf5; color:#065f46; border:1px solid #d1fae5 }
        .badge.muted { background:#f3f4f6; color:#374151; border:1px solid #e5e7eb }
        @media (max-width: 640px){
          .dep-form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
};

export default DepartmentsManager;

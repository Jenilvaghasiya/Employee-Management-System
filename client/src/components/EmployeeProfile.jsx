import { useEffect, useRef, useState } from 'react';
import { employeesService } from '../services/employeesService';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const initial = { name: '', email: '', password: '', reporting_head_id: '' };

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [meta, setMeta] = useState({ department: null, designation: null, reporting_head: null, status: '' });
  const [facePath, setFacePath] = useState('');
  const [today, setToday] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [enrolling, setEnrolling] = useState(false);
  const fileRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [emp, td] = await Promise.all([
        user?.id ? employeesService.get(user.id) : Promise.resolve(null),
        attendanceService.getToday().catch(() => null),
      ]);
      if (emp) {
        setForm({ name: emp.name || '', email: emp.email || '', password: '', reporting_head_id: emp.reporting_head_id || '' });
        const statusLabel = (emp.status === true || String(emp.status) === 'Active') ? 'Active' : 'Inactive';
        setMeta({ department: emp.department, designation: emp.designation, reporting_head: emp.reporting_head || null, status: statusLabel });
        setFacePath(emp.face_image_path || '');
      }
      setToday(td);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      setEmployeesError('');
      const res = await api.get('/employees/public');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setEmployees(list);
    } catch (err) {
      setEmployees([]);
      setEmployeesError('Failed to load reporting heads');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);
  useEffect(() => { fetchEmployees(); }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const nameRegex = /^[A-Za-z .]{2,}$/; // letters, space, dot

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    const errs = {};
    if (!nameRegex.test(form.name.trim())) errs.name = 'Enter a valid name (alphabets, space and dot)';
    if (!emailRegex.test(form.email.trim())) errs.email = 'Enter a valid email address';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = { name: form.name.trim(), email: form.email.trim() };
      if (form.password) payload.password = form.password;
      if (typeof form.reporting_head_id !== 'undefined') {
        payload.reporting_head_id = form.reporting_head_id ? Number(form.reporting_head_id) : null;
      }
      const updated = await employeesService.updateSelf(payload);
      if (updated?.id) {
        setSuccess('Profile updated');
        setForm((s) => ({ ...s, password: '' }));
        const statusLabel = (updated.status === true || String(updated.status) === 'Active') ? 'Active' : 'Inactive';
        setMeta({ department: updated.department, designation: updated.designation, reporting_head: updated.reporting_head || null, status: statusLabel });
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.name || user?.name || 'NA').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const UPLOADS_BASE = 'http://localhost:3000';

  const handleFaceClick = () => {
    fileRef.current?.click();
  };

  const onFaceSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEnrolling(true);
      setError('');
      setSuccess('');
      const res = await employeeService.faceEnroll(file);
      const newPath = res?.face_image_path;
      if (newPath) {
        setFacePath(newPath);
        setSuccess('Profile picture updated');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setEnrolling(false);
      // reset input to allow same file re-selection
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="emp-profile-wrap">
      <div className="pro-card" style={{padding: 20}}>
        <div className="emp-header">
          <div className="emp-avatar">
            {facePath ? (
              <img
                src={`${UPLOADS_BASE}${facePath}`}
                alt="Profile"
                style={{ width: '100%', height: '100%', borderRadius: '999px', objectFit: 'cover' }}
                onError={(e)=>{ e.currentTarget.style.display='none'; }}
              />
            ) : (
              initials
            )}
          </div>
          <div className="emp-header-meta">
            <h3>{form.name || '—'}</h3>
            <p>{form.email || '—'}</p>
            <div className="emp-tags">
              <span className={`badge ${meta.status==='Active' ? 'success' : 'muted'}`}>{meta.status || '—'}</span>
              <span className="badge muted">{meta.department?.name || 'No Department'}</span>
              <span className="badge muted">{meta.designation?.title || 'No Designation'}</span>
              <span className="badge muted">{meta.reporting_head?.name ? `Head: ${meta.reporting_head.name}` : 'No Reporting Head'}</span>
            </div>
            <div className="emp-actions" style={{ marginTop: 8 }}>
              <button type="button" className="btn" onClick={handleFaceClick} disabled={enrolling}>
                {enrolling ? 'Updating photo...' : 'Re-capture / Change Photo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={onFaceSelected}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pro-grid-2">
        <div className="pro-card">
          <div className="pro-card-head"><h3>Edit Profile</h3></div>
          {error && <div className="dep-alert error">{error}</div>}
          {success && <div className="dep-alert success">{success}</div>}
          <form onSubmit={onSubmit} className="emp-form">
            <div className="dep-field">
              <label>Name</label>
              <input className="dep-input" type="text" value={form.name} onChange={e=>{ setForm(s=>({...s, name: e.target.value})); setFieldErrors(f=>({...f, name: undefined})); }} required />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </div>
            <div className="dep-field">
              <label>Email</label>
              <input className="dep-input" type="email" value={form.email} onChange={e=>{ setForm(s=>({...s, email: e.target.value})); setFieldErrors(f=>({...f, email: undefined})); }} required />
              {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
            </div>
            <div className="dep-field">
              <label>Reporting Head</label>
              <select
                className="dep-input"
                value={form.reporting_head_id}
                onChange={e=> setForm(s=>({...s, reporting_head_id: e.target.value }))}
                disabled={employeesLoading}
              >
                <option value="">No Reporting Head</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {employeesError && <small className="field-error">{employeesError}</small>}
            </div>
            <div className="dep-field">
              <label>New Password (optional)</label>
              <input className="dep-input" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(s=>({...s, password: e.target.value}))} />
            </div>
            <div className="emp-form-actions">
              <button type="submit" className="btn primary" disabled={saving}>{saving? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
        <div className="pro-card">
          <div className="pro-card-head"><h3>Today</h3></div>
          <div className="pro-list">
            <div className="pro-mini"><span className="pro-li-title">Date</span><span className="pro-li-sub">{today?.date || '—'}</span></div>
            <div className="pro-mini"><span className="pro-li-title">Sign In</span><span className="pro-li-sub">{today?.sign_in_time || '—'}</span></div>
            <div className="pro-mini"><span className="pro-li-title">Sign Out</span><span className="pro-li-sub">{today?.sign_out_time || '—'}</span></div>
          </div>
        </div>
      </div>

      <style>{`
        .emp-profile-wrap { display:grid; gap:20px }
        .emp-header { display:flex; gap:16px; align-items:center }
        .emp-avatar { width:64px; height:64px; border-radius:999px; background: linear-gradient(135deg,#2563eb,#7c3aed); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:20px; overflow:hidden }
        .emp-header-meta h3 { margin:0; font-size:18px; color:#111827; font-weight:800 }
        .emp-header-meta p { margin:4px 0; color:#6b7280 }
        .emp-tags { display:flex; gap:8px; flex-wrap:wrap }
        .emp-form { display:grid; gap:12px }
        .emp-form-actions { display:flex; justify-content:flex-end }
        .field-error { color:#b91c1c; font-size:12px }
      `}</style>
    </section>
  );
};

export default EmployeeProfile;

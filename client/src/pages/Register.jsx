import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Auth.css';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department_id: '',
    designation_id: '',
    reporting_head_id: '',
  });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      fetchDesignations(formData.department_id);
    }
  }, [formData.department_id]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchDesignations = async (departmentId) => {
    try {
      const response = await api.get(`/designations/department/${departmentId}`);
      setDesignations(response.data.data || []);
    } catch (err) {
      console.error('Error fetching designations:', err);
      setDesignations([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data || []);
    } catch (err) {
      setEmployees([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;

      const sanitizedData = {
        ...dataToSend,
        department_id: dataToSend.department_id || null,
        designation_id: dataToSend.designation_id || null,
        reporting_head_id: dataToSend.reporting_head_id || null,
      };

      await register(sanitizedData);
      setSuccess('Registration successful! Redirecting to login...');

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        department_id: '',
        designation_id: '',
        reporting_head_id: '',
      });

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2 className="auth-title">Employee Management System</h2>
        <h3 className="auth-subtitle">Register</h3>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="department_id">Department</label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="designation_id">Designation</label>
            <select
              id="designation_id"
              name="designation_id"
              value={formData.designation_id}
              onChange={handleChange}
              disabled={!formData.department_id}
            >
              <option value="">Select Designation</option>
              {designations.map((desig) => (
                <option key={desig.id} value={desig.id}>
                  {desig.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reporting_head_id">Reporting Head</label>
            <select
              id="reporting_head_id"
              name="reporting_head_id"
              value={formData.reporting_head_id}
              onChange={handleChange}
            >
              <option value="">Select Reporting Head</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="auth-button register-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;

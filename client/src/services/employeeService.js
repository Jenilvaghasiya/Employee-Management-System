import api from './api';

export const employeeService = {
  getMe: async () => {
    const res = await api.get('/employees/me');
    return res.data?.data || null;
  },
  getById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data?.data || null;
  },
  faceEnroll: async (file) => {
    const fd = new FormData();
    fd.append('image', file, file?.name || 'enroll.jpg');
    const res = await api.post('/employees/my/face-enroll', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || null;
  },
};

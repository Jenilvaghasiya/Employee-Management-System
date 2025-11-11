import api from './api';

export const attendanceService = {
  signIn: async (payload = {}) => {
    // If payload contains a File/Blob under 'image', send as multipart
    if (payload && payload.image instanceof Blob) {
      const fd = new FormData();
      fd.append('image', payload.image, payload.image.name || 'attendance.jpg');
      const res = await api.post('/attendance/sign-in', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data || null;
    }
    const res = await api.post('/attendance/sign-in', payload);
    return res.data?.data || null;  // Return null instead of res.data
  },
  signOut: async (payload = {}) => {
    const res = await api.post('/attendance/sign-out', payload);
    return res.data?.data || null;  // Return null instead of res.data
  },
  listMine: async () => {
    const res = await api.get('/attendance/my');
    return res.data?.data || [];
  },
  getToday: async () => {
    const res = await api.get('/attendance/my/today');
    return res.data?.data || null;
  },
  listAll: async (params = {}) => {
    const search = new URLSearchParams();
    if (params.month) search.set('month', String(params.month));
    if (params.year) search.set('year', String(params.year));
    const qs = search.toString();
    const url = `/attendance${qs ? `?${qs}` : ''}`;
    const res = await api.get(url);
    return res.data?.data || [];
  },
};

import api from '../client';

const BASE_URL = '/v1/admin/attendances';

export const getAttendances = (params) => 
    api.get(BASE_URL, { params });

export const checkIn = (employeeId) => 
    api.post(`${BASE_URL}/check-in`, { employee_id: employeeId });

export const checkOut = (employeeId) => 
    api.post(`${BASE_URL}/check-out`, { employee_id: employeeId });

export const getAttendanceStatus = (employeeId) => 
    api.get(`${BASE_URL}/status/${employeeId}`);

export const createAttendance = (data) =>
    api.post(BASE_URL, data);

export const updateAttendance = (id, data) =>
    api.put(`${BASE_URL}/${id}`, data);

export const deleteAttendance = (id) =>
    api.delete(`${BASE_URL}/${id}`);

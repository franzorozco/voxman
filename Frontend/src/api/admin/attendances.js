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

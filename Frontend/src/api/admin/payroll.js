import api from '../client';

const BASE_URL = '/v1/admin/payroll';

export const getPayrollHistory = (params) => 
    api.get(`${BASE_URL}/history`, { params });

export const calculatePayroll = (employeeId, month, year) => 
    api.post(`${BASE_URL}/calculate`, { employee_id: employeeId, month, year });

export const payPayroll = (data) => 
    api.post(`${BASE_URL}/pay`, data);

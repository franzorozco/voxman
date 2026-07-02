import api from '../client';

const BASE_URL = '/v1/admin/returns';

export const getReturns = (params) => 
   api.get(BASE_URL, { params });

export const getReturnDetails = (id) => 
   api.get(`${BASE_URL}/${id}`);

export const approveReturn = (id, data) => 
   api.post(`${BASE_URL}/${id}/approve`, data);

export const rejectReturn = (id) => 
   api.post(`${BASE_URL}/${id}/reject`);

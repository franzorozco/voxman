import api from '../client';

const BASE_URL = '/v1/admin/quarantine';

export const getQuarantineItems = async (branchId = null, status = 'pending') => {
  const params = {};
  if (branchId) params.branch_id = branchId;
  if (status) params.status = status;

  return api.get(BASE_URL, { params });
};

export const resolveQuarantineItem = async (id, data) => {
  return api.post(`${BASE_URL}/${id}/resolve`, data);
};

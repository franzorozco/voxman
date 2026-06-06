import api from "./client";

const BASE_URL = "/v1/admin/branches";

export const getBranches = async (search = "") => {
  const { data } = await api.get(`${BASE_URL}?search=${search}`);
  return data;
};

export const getBranch = async (id) => {
  const { data } = await api.get(`${BASE_URL}/${id}`);
  return data;
};

export const createBranch = async (formData) => {
  const { data } = await api.post(BASE_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateBranch = async (id, formData) => {
  const { data } = await api.post(`${BASE_URL}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteBranch = async (id) => {
  const { data } = await api.delete(`${BASE_URL}/${id}`);
  return data;
};

export const getDeletedBranches = async () => {
  const { data } = await api.get(`${BASE_URL}/deleted`);
  return data;
};

export const restoreBranch = async (id) => {
  const { data } = await api.post(`${BASE_URL}/${id}/restore`);
  return data;
};

export const forceDeleteBranch = async (id) => {
  const { data } = await api.delete(`${BASE_URL}/${id}/force`);
  return data;
};

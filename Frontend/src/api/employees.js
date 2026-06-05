import api from "./client";

const BASE_URL = "/v1/admin/employees";

export const getEmployees = async () => {
  const { data } = await api.get(BASE_URL);
  return data;
};

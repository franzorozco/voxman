import api from "../client";

export const getSystemSettings = async () => {
  const response = await api.get("/v1/admin/system-settings");
  return response.data;
};

export const updateSystemSetting = async (key, data) => {
  const response = await api.put(`/v1/admin/system-settings/${key}`, data);
  return response.data;
};
